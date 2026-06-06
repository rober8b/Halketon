import type { MilestoneInput } from './types';
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

// Parsea "500000\n30/08/2026" o variantes. Detecta primero la fecha y después busca
// el monto en las líneas restantes para evitar interpretar "30/08/2026" como número.
function parseGoal(text: string): { goal_amount: number | null; deadline: string | null } {
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const lines = text.split(/[\n,;]/).map((l) => l.trim()).filter(Boolean);

  let deadline: string | null = null;
  let dateLineIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(dateRegex);
    if (match) {
      const [, d, m, y] = match;
      const year = y.length === 2 ? `20${y}` : y;
      deadline = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      dateLineIndex = i;
      break;
    }
  }

  let goal_amount: number | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (i === dateLineIndex) continue;
    const line = lines[i].replace(dateRegex, '').trim();
    const digits = line.replace(/[^\d]/g, '');
    if (digits.length > 0) {
      goal_amount = parseInt(digits, 10);
      break;
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
  const normalized = text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.includes('no')) return false;
  const yesWords = new Set([
    'si',
    'yes',
    'ok',
    'oka',
    'okey',
    'dale',
    'confirmo',
    'confirmado',
    'adelante',
    'listo',
    'perfecto',
    'publicala',
    'publicar',
  ]);
  return tokens.some((t) => yesWords.has(t));
}

export async function processMessage(
  phoneNumber: string,
  incomingText: string
): Promise<string[]> {
  const state = await loadConversationState(phoneNumber);
  const replies: string[] = [];

  try {
    switch (state.current_step) {
      case 'greeting': {
        const { ong_name, contact_name } = parseOngAndContact(incomingText);
        state.collected_data.ong_name = ong_name;
        state.collected_data.contact_name = contact_name;
        state.current_step = 'collect_cause';
        replies.push(COLLECT_CAUSE_PROMPT(ong_name));
        break;
      }

      case 'collect_cause': {
        state.collected_data.cause = incomingText.trim();
        state.current_step = 'collect_goal';
        replies.push(COLLECT_GOAL_PROMPT());
        break;
      }

      case 'collect_goal': {
        const { goal_amount, deadline } = parseGoal(incomingText);
        if (!goal_amount || !deadline) {
          replies.push(
            '⚠️ No pude entender bien los datos. Necesito el monto y la fecha en dos líneas:\n\n500000\n30/08/2026'
          );
          break;
        }
        state.collected_data.goal_amount = goal_amount;
        state.collected_data.deadline = deadline;
        state.current_step = 'collect_milestones';
        replies.push(COLLECT_MILESTONES_PROMPT(goal_amount));
        break;
      }

      case 'collect_milestones': {
        const milestones = parseMilestones(incomingText);
        if (milestones.length < 1) {
          replies.push(
            '⚠️ No pude leer los hitos. Usá el formato:\n\n100000: Compramos materiales\n300000: Capacitamos voluntarios\n500000: Completamos el proyecto'
          );
          break;
        }
        state.collected_data.milestones = milestones;
        state.current_step = 'generating';
        // El primer mensaje sale antes de llamar a Gemini para que la ONG vea el estado.
        replies.push(GENERATING_PROMPT());

        await saveConversationState(state);

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

        const { campaignId, slug } = await createCampaignWithAssets(
          ongId,
          state.collected_data,
          generated
        );
        state.campaign_id = campaignId;
        state.current_step = 'confirming';

        replies.push(CAMPAIGN_CONFIRM_PROMPT(state.collected_data, campaignUrl(slug)));
        break;
      }

      case 'generating': {
        // El usuario escribió mientras Gemini sigue generando. No reiniciamos el progreso.
        replies.push(
          'Estoy todavía generando tu campaña, dame unos segundos más. ⏳\n\nSi pasaron más de 2 minutos, escribí *reiniciar* para empezar de nuevo.'
        );
        break;
      }

      case 'confirming': {
        if (isConfirmation(incomingText)) {
          if (!state.campaign_id) {
            replies.push(
              '⚠️ Hubo un error — no encontré la campaña guardada. Escribí "reiniciar" para empezar de nuevo.'
            );
            break;
          }
          await publishCampaign(state.campaign_id);

          const { supabaseAdmin } = await import('@/lib/supabase/client');
          const { data: campaign } = await supabaseAdmin
            .from('campaigns')
            .select('slug')
            .eq('id', state.campaign_id)
            .single();
          const slug = campaign?.slug ?? '';
          state.current_step = 'done';
          replies.push(DONE_PROMPT(campaignUrl(slug)));
        } else {
          state.current_step = 'greeting';
          state.collected_data = {};
          state.campaign_id = null;
          state.ong_id = null;
          replies.push('Campaña cancelada. Escribime cuando quieras empezar de nuevo. 👋');
        }
        break;
      }

      case 'done': {
        state.current_step = 'greeting';
        state.collected_data = {};
        state.campaign_id = null;
        replies.push(GREETING_PROMPT);
        break;
      }

      default: {
        state.current_step = 'greeting';
        state.collected_data = {};
        replies.push(GREETING_PROMPT);
      }
    }
  } catch (err) {
    console.error('[agent] Error en step', state.current_step, err);
    state.current_step = 'error';
    replies.push('😕 Ocurrió un error inesperado. Escribí "reiniciar" para intentarlo de nuevo.');
  }

  await saveConversationState(state);
  return replies;
}

// Comando especial de reinicio
export async function handleSpecialCommands(
  phoneNumber: string,
  text: string
): Promise<string[] | null> {
  const normalized = text.toLowerCase().trim();
  if (['reiniciar', 'reset', 'restart', 'inicio'].includes(normalized)) {
    const state = await loadConversationState(phoneNumber);
    state.current_step = 'greeting';
    state.collected_data = {};
    state.campaign_id = null;
    await saveConversationState(state);
    return [GREETING_PROMPT];
  }
  return null;
}
