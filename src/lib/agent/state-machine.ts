import type { AgentState, CollectedData, MilestoneInput } from './types';
import {
  GREETING_PROMPT,
  COLLECT_CAUSE_PROMPT,
  COLLECT_GOAL_PROMPT,
  COLLECT_MILESTONES_PROMPT,
  GENERATING_PROMPT,
  CAMPAIGN_CONFIRM_PROMPT,
  DONE_PROMPT,
  buildCampaignGenerationPrompt,
  type GeneratedCampaign,
} from './prompts';
import { generateJSON } from './gemini';
import {
  upsertOng,
  createCampaignWithAssets,
  publishCampaign,
  saveConversationState,
  loadConversationState,
} from './tools';

const APP_URL = process.env.APP_URL ?? 'http://localhost:4000';

function campaignUrl(slug: string): string {
  return `${APP_URL}/c/${slug}`;
}

// Parsea "Fundación XYZ / Juan Pérez" o líneas separadas
function parseOngAndContact(text: string): { ong_name: string; contact_name: string } {
  const separators = [' / ', ' - ', '\n', ','];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const [ong, contact] = text.split(sep).map((s) => s.trim());
      if (ong && contact) return { ong_name: ong, contact_name: contact };
    }
  }
  return { ong_name: text.trim(), contact_name: text.trim() };
}

// Parsea "500000\n30/08/2026" o variantes
function parseGoal(text: string): { goal_amount: number | null; deadline: string | null } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const numberLine = lines.find((l) => /[\d.,]+/.test(l));
  const dateLine = lines.find((l) => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l));

  const goal_amount = numberLine
    ? parseInt(numberLine.replace(/[^\d]/g, ''), 10)
    : null;

  let deadline: string | null = null;
  if (dateLine) {
    const match = dateLine.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
      const [, d, m, y] = match;
      const year = y.length === 2 ? `20${y}` : y;
      deadline = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  return { goal_amount, deadline };
}

// Parsea 3 milestones en formato "MONTO: descripción"
function parseMilestones(text: string): MilestoneInput[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const milestones: MilestoneInput[] = [];
  let seq = 1;

  for (const line of lines) {
    const match = line.match(/^([\d.,]+)\s*[:–-]\s*(.+)$/);
    if (match) {
      const amount = parseInt(match[1].replace(/[^\d]/g, ''), 10);
      const description = match[2].trim();
      if (amount && description) {
        milestones.push({ sequence: seq++, target_amount: amount, description });
      }
    }
  }

  return milestones;
}

function isConfirmation(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return ['si', 'sí', 'yes', 'ok', 'dale', 'confirmo', 'confirmado', 'adelante'].some((w) =>
    normalized.includes(w)
  );
}

// === Modo DEMO ===
// Con DEMO_MODE=true la generación es instantánea: NO llama a Gemini ni escribe
// en la base. Devuelve una campaña pre-generada y apunta al showcase ya cargado.
// Esto hace el pitch en vivo 100% determinístico y rápido.
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_SHOWCASE_SLUG = 'comedor-esperanza';

function buildDemoCampaign(data: CollectedData): GeneratedCampaign {
  const ong = data.ong_name ?? 'tu organización';
  return {
    title: 'Comedor Esperanza: una mesa llena para el barrio',
    description:
      `${ong} abre un comedor para que ningún chico del barrio empiece ni termine ` +
      `la escuela con hambre. Con tu aporte garantizamos desayuno y merienda diaria ` +
      `para 80 chicos, compramos equipamiento de cocina y sostenemos la compra de ` +
      `alimentos todo el año. Cada hito se libera con evidencia pública y los fondos ` +
      `quedan en escrow on-chain: transparencia total, del primer peso al último.`,
    impact_per_amount: {
      '10000': 'Un almuerzo completo para una familia.',
      '30000': 'Tres viandas y frutas para un fin de semana.',
      '60000': 'Compra semanal de mercadería básica.',
    },
    content_assets: [
      {
        channel: 'whatsapp',
        audience: 'amigos y familia',
        content:
          '🍲 Estoy ayudando al Comedor Esperanza. Con $10.000 ya cubrís un almuerzo ' +
          'completo para una familia. Sumate acá 👉',
      },
      {
        channel: 'instagram',
        audience: 'seguidores generales',
        content:
          'Hoy una mesa llena cambia la semana de un barrio entero 🧡 Comedor Esperanza ' +
          'necesita tu apoyo. #EnMasaSocial #Solidaridad #Argentina',
      },
      {
        channel: 'twitter',
        audience: 'público general',
        content:
          '80 chicos, una mesa, una comunidad. Ayudá al Comedor Esperanza a sostener ' +
          'desayuno y merienda todo el año. #EnMasaSocial #Donar',
      },
    ],
  };
}

// Genera la campaña y deja el estado en 'confirming'. Reutilizable para el primer
// intento (desde collect_milestones) y para reintentos (paso 'generating').
async function runCampaignGeneration(
  state: AgentState,
  phoneNumber: string
): Promise<string> {
  let slug: string;

  if (DEMO_MODE) {
    const generated = buildDemoCampaign(state.collected_data);
    state.collected_data.title = generated.title;
    state.collected_data.description = generated.description;
    state.collected_data.impact_per_amount = generated.impact_per_amount;
    state.collected_data.content_assets = generated.content_assets;
    // No seteamos campaign_id real en demo: la columna es UUID/FK en Supabase.
    state.campaign_id = null;
    slug = DEMO_SHOWCASE_SLUG;
  } else {
    const prompt = buildCampaignGenerationPrompt(state.collected_data);
    const generated = await generateJSON<GeneratedCampaign>(prompt);

    state.collected_data.title = generated.title;
    state.collected_data.description = generated.description;
    state.collected_data.impact_per_amount = generated.impact_per_amount;
    state.collected_data.content_assets = generated.content_assets;

    const ongId = await upsertOng(
      phoneNumber,
      state.collected_data.ong_name ?? '',
      state.collected_data.contact_name ?? ''
    );
    state.ong_id = ongId;

    const created = await createCampaignWithAssets(ongId, state.collected_data, generated);
    state.campaign_id = created.campaignId;
    slug = created.slug;
  }

  state.current_step = 'confirming';
  return CAMPAIGN_CONFIRM_PROMPT(state.collected_data, campaignUrl(slug));
}

export async function processMessage(
  phoneNumber: string,
  incomingText: string
): Promise<string> {
  const state = await loadConversationState(phoneNumber);
  let reply = '';

  try {
    switch (state.current_step) {
      case 'greeting': {
        const { ong_name, contact_name } = parseOngAndContact(incomingText);
        state.collected_data.ong_name = ong_name;
        state.collected_data.contact_name = contact_name;
        state.current_step = 'collect_cause';
        reply = COLLECT_CAUSE_PROMPT(ong_name);
        break;
      }

      case 'collect_cause': {
        state.collected_data.cause = incomingText.trim();
        state.current_step = 'collect_goal';
        reply = COLLECT_GOAL_PROMPT();
        break;
      }

      case 'collect_goal': {
        const { goal_amount, deadline } = parseGoal(incomingText);
        if (!goal_amount || !deadline) {
          reply =
            '⚠️ No pude entender bien los datos. Necesito el monto y la fecha en dos líneas:\n\n500000\n30/08/2026';
          break;
        }
        state.collected_data.goal_amount = goal_amount;
        state.collected_data.deadline = deadline;
        state.current_step = 'collect_milestones';
        reply = COLLECT_MILESTONES_PROMPT(goal_amount);
        break;
      }

      case 'collect_milestones': {
        const milestones = parseMilestones(incomingText);
        if (milestones.length < 1) {
          reply =
            '⚠️ No pude leer los hitos. Usá el formato:\n\n100000: Compramos materiales\n300000: Capacitamos voluntarios\n500000: Completamos el proyecto';
          break;
        }
        state.collected_data.milestones = milestones;
        state.current_step = 'generating';

        // Guardamos el estado con 'generating' antes de llamar a Gemini
        await saveConversationState(state);

        reply = await runCampaignGeneration(state, phoneNumber);
        break;
      }

      case 'generating': {
        // Reintento de generación: los datos ya están en collected_data,
        // el usuario manda cualquier mensaje (ej: "listo") para reintentar.
        reply = await runCampaignGeneration(state, phoneNumber);
        break;
      }

      case 'confirming': {
        if (isConfirmation(incomingText)) {
          if (DEMO_MODE) {
            state.current_step = 'done';
            reply = DONE_PROMPT(campaignUrl(DEMO_SHOWCASE_SLUG));
            break;
          }
          if (!state.campaign_id) {
            reply = '⚠️ Hubo un error — no encontré la campaña guardada. Escribí "reiniciar" para empezar de nuevo.';
            break;
          }
          await publishCampaign(state.campaign_id);

          // Para obtener el slug necesitamos consultarlo
          const { data: campaign } = await import('@/lib/supabase/client').then(
            ({ supabaseAdmin }) =>
              supabaseAdmin
                .from('campaigns')
                .select('slug')
                .eq('id', state.campaign_id!)
                .single()
          );
          const slug = campaign?.slug ?? '';
          state.current_step = 'done';
          reply = DONE_PROMPT(campaignUrl(slug));
        } else {
          state.current_step = 'greeting';
          state.collected_data = {};
          state.campaign_id = null;
          state.ong_id = null;
          reply = 'Campaña cancelada. Escribime cuando quieras empezar de nuevo. 👋';
        }
        break;
      }

      case 'done': {
        // Reinicio para nueva campaña
        state.current_step = 'greeting';
        state.collected_data = {};
        state.campaign_id = null;
        reply = GREETING_PROMPT;
        break;
      }

      default: {
        state.current_step = 'greeting';
        state.collected_data = {};
        reply = GREETING_PROMPT;
      }
    }
  } catch (err) {
    console.error('[agent] Error en step', state.current_step, err);
    if (state.current_step === 'generating') {
      // No perdemos los datos recopilados: el usuario reintenta con "listo".
      reply =
        '⏳ Estamos con mucha demanda generando tu campaña. Escribí *listo* para reintentar en unos segundos.';
    } else {
      state.current_step = 'error';
      reply = '😕 Ocurrió un error inesperado. Escribí "reiniciar" para intentarlo de nuevo.';
    }
  }

  await saveConversationState(state);
  return reply;
}

// Comando especial de reinicio
export async function handleSpecialCommands(
  phoneNumber: string,
  text: string
): Promise<string | null> {
  const normalized = text.toLowerCase().trim();
  if (['reiniciar', 'reset', 'restart', 'inicio'].includes(normalized)) {
    const state = await loadConversationState(phoneNumber);
    state.current_step = 'greeting';
    state.collected_data = {};
    state.campaign_id = null;
    await saveConversationState(state);
    return GREETING_PROMPT;
  }
  return null;
}
