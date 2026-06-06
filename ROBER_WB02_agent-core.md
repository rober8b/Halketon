# ROBER_WB02 — Agente conversacional en WhatsApp
**Owner:** Rober  
**Estado:** ⏳ Pendiente  
**Depende de:** ROBER_WB01  
**Tiempo estimado:** 2 horas

---

## Objetivo

Implementar el agente de IA que vive en WhatsApp. La ONG le escribe al número de WhatsApp configurado en Kapso, el agente le hace 5 preguntas guiadas, y al final tiene toda la información para crear la campaña (eso lo hace ROBER_WB03). Este WB termina cuando el agente conduce la conversación completa y responde coherentemente.

---

## Pasos

### 1. Crear tipos de conversación

```typescript
// src/types/conversation.ts
export type ConversationStep =
  | 'greeting'
  | 'cause'
  | 'goal'
  | 'impact'
  | 'milestones'
  | 'promoters'
  | 'confirming'
  | 'generating'
  | 'done';

export interface CollectedData {
  ongName?: string;
  cause?: string;
  goalAmount?: number;       // en pesos
  deadline?: string;         // ISO date
  impactHint?: string;       // "cada $5k = 1 kit"
  milestonesCount?: number;  // default 4
  promoters?: string[];      // nombres del equipo
}

export interface ConversationState {
  phoneNumber: string;
  ongId?: string;
  currentStep: ConversationStep;
  collectedData: CollectedData;
  campaignId?: string;
  updatedAt: string;
}
```

### 2. Crear `src/lib/agent/gemini.ts`

```typescript
// src/lib/agent/gemini.ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
});

/**
 * Llama a Gemini con un prompt y retorna texto limpio.
 * Si Gemini falla, usa el fallback provisto.
 */
export async function callGemini(
  prompt: string,
  fallback: string
): Promise<string> {
  try {
    const result = await geminiFlash.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini error, usando fallback:', err);
    return fallback;
  }
}

/**
 * Llama a Gemini esperando respuesta JSON.
 * Si falla o retorna JSON inválido, usa el fallbackData.
 */
export async function callGeminiJSON<T>(
  prompt: string,
  fallbackData: T
): Promise<T> {
  try {
    const result = await geminiFlash.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch (err) {
    console.error('Gemini JSON error, usando fallback:', err);
    return fallbackData;
  }
}
```

### 3. Crear `src/lib/agent/prompts.ts`

```typescript
// src/lib/agent/prompts.ts
import { CollectedData, ConversationStep } from '@/types/conversation';

export const SYSTEM_PROMPT = `Sos el agente de En Masa Social, una plataforma que ayuda a ONGs argentinas a lanzar campañas de donación. Conversás por WhatsApp con personas de ONGs.

Tu objetivo: recopilar información para crear una campaña en 5-7 turnos.

Reglas:
- Hablás en español rioplatense (vos, tenés, querés). Cercano pero profesional.
- Una pregunta por mensaje. Nunca dos preguntas seguidas.
- Mensajes cortos (máximo 3 oraciones).
- Si la respuesta es ambigua, pedís aclaración con un ejemplo concreto.
- No prometés cosas que la plataforma no hace.
- Si la persona se va por las ramas, la traés de vuelta amablemente.`;

export function buildAgentPrompt(
  step: ConversationStep,
  userMessage: string,
  collected: CollectedData
): string {
  const context = `
${SYSTEM_PROMPT}

Datos recolectados hasta ahora:
${JSON.stringify(collected, null, 2)}

Paso actual: ${step}
Mensaje del usuario: "${userMessage}"

Respondé con UN mensaje corto en español rioplatense para avanzar al próximo paso.
Si ya tenés toda la info, confirmá con un resumen y pedí aprobación.
NO respondas con JSON. Solo texto plano, como un WhatsApp real.`;

  return context;
}

export function buildSummaryMessage(collected: CollectedData): string {
  return `¡Perfecto! Te hago un resumen antes de crear la campaña:

📋 *Causa:* ${collected.cause}
💰 *Meta:* $${collected.goalAmount?.toLocaleString('es-AR')} para ${collected.deadline}
🎯 *Impacto:* ${collected.impactHint}
🏁 *Hitos:* ${collected.milestonesCount ?? 4} tramos de liberación
👥 *Equipo:* ${collected.promoters?.join(', ')}

¿Arrancamos con la campaña? Respondé *sí* para confirmar o decime qué querés cambiar.`;
}
```

### 4. Crear `src/lib/agent/state-machine.ts`

```typescript
// src/lib/agent/state-machine.ts
import { supabaseAdmin } from '@/lib/supabase/client';
import { ConversationState, ConversationStep, CollectedData } from '@/types/conversation';

export async function getOrCreateConversationState(
  phoneNumber: string
): Promise<ConversationState> {
  const { data } = await supabaseAdmin
    .from('conversation_state')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (data) return data as ConversationState;

  const newState: ConversationState = {
    phoneNumber,
    currentStep: 'greeting',
    collectedData: {},
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.from('conversation_state').insert({
    phone_number: phoneNumber,
    current_step: 'greeting',
    collected_data: {},
    updated_at: new Date().toISOString(),
  });

  return newState;
}

export async function updateConversationState(
  phoneNumber: string,
  update: Partial<{ currentStep: ConversationStep; collectedData: CollectedData; campaignId: string }>
): Promise<void> {
  await supabaseAdmin
    .from('conversation_state')
    .update({
      current_step: update.currentStep,
      collected_data: update.collectedData,
      campaign_id: update.campaignId,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);
}

export async function resetConversationState(phoneNumber: string): Promise<void> {
  await supabaseAdmin
    .from('conversation_state')
    .update({
      current_step: 'greeting',
      collected_data: {},
      campaign_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);
}

/**
 * Determina el próximo paso basado en los datos recolectados.
 */
export function getNextStep(
  currentStep: ConversationStep,
  collectedData: CollectedData
): ConversationStep {
  switch (currentStep) {
    case 'greeting': return 'cause';
    case 'cause': return collectedData.cause ? 'goal' : 'cause';
    case 'goal': return (collectedData.goalAmount && collectedData.deadline) ? 'impact' : 'goal';
    case 'impact': return collectedData.impactHint ? 'milestones' : 'impact';
    case 'milestones': return 'promoters';
    case 'promoters': return collectedData.promoters?.length ? 'confirming' : 'promoters';
    case 'confirming': return 'generating';
    default: return 'done';
  }
}

/**
 * Extrae datos del mensaje del usuario según el paso actual.
 * Retorna CollectedData parcial con lo que encontró.
 */
export function extractDataFromMessage(
  step: ConversationStep,
  message: string,
  existing: CollectedData
): CollectedData {
  const updated = { ...existing };

  switch (step) {
    case 'cause':
      updated.cause = message;
      break;
    case 'goal': {
      // Extraer monto (números con k, mil, millón)
      const amountMatch = message.match(/[\d.,]+\s*(k|mil|millón|millon)?/i);
      if (amountMatch) {
        let amount = parseFloat(amountMatch[0].replace(/[.,]/g, ''));
        if (/k/i.test(amountMatch[1] ?? '')) amount *= 1000;
        if (/mil/i.test(amountMatch[1] ?? '')) amount *= 1000;
        if (/mill/i.test(amountMatch[1] ?? '')) amount *= 1_000_000;
        updated.goalAmount = amount;
      }
      // Extraer plazo (simple: "fin de mes", "30 días", etc.)
      if (/fin de mes/i.test(message)) {
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
        updated.deadline = endOfMonth.toISOString().split('T')[0];
      } else {
        const dateMatch = message.match(/\d{1,2}\/\d{1,2}\/?\d{0,4}/);
        if (dateMatch) updated.deadline = dateMatch[0];
      }
      break;
    }
    case 'impact':
      updated.impactHint = message;
      break;
    case 'milestones': {
      const numMatch = message.match(/\d+/);
      updated.milestonesCount = numMatch ? parseInt(numMatch[0]) : 4;
      break;
    }
    case 'promoters': {
      // Extraer nombres separados por coma, "y", o saltos de línea
      const names = message
        .split(/[,\ny]+/)
        .map(n => n.trim())
        .filter(n => n.length > 1);
      if (names.length > 0) updated.promoters = names;
      break;
    }
  }

  return updated;
}
```

### 5. Crear el webhook del agente

```typescript
// src/app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateConversationState,
  updateConversationState,
  getNextStep,
  extractDataFromMessage,
} from '@/lib/agent/state-machine';
import { buildAgentPrompt, buildSummaryMessage } from '@/lib/agent/prompts';
import { callGemini } from '@/lib/agent/gemini';

// Kapso envía el webhook en este formato — ajustar si difiere
function parseKapsoWebhook(body: Record<string, unknown>): { from: string; text: string } | null {
  try {
    // Adaptar según la estructura real de Kapso
    const entry = (body as Record<string, unknown[]>).entry?.[0] as Record<string, unknown[]>;
    const change = entry?.changes?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown[]>;
    const message = value?.messages?.[0] as Record<string, unknown>;
    if (!message) return null;
    return {
      from: message.from as string,
      text: (message.text as Record<string, string>)?.body ?? '',
    };
  } catch {
    return null;
  }
}

async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const response = await fetch(
    `${process.env.WHATSAPP_API_URL ?? 'https://api.kapso.ai/meta/whatsapp'}/v1/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KAPSO_API_KEY}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );
  if (!response.ok) {
    console.error('Error enviando mensaje WhatsApp:', await response.text());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificación de webhook de Meta (si aplica)
    if (body['hub.challenge']) {
      return NextResponse.json({ challenge: body['hub.challenge'] });
    }

    const parsed = parseKapsoWebhook(body);
    if (!parsed) return NextResponse.json({ ok: true });

    const { from, text } = parsed;
    if (!text) return NextResponse.json({ ok: true });

    const state = await getOrCreateConversationState(from);

    // Si la campaña ya está creada, ignorar mensajes
    if (state.currentStep === 'done') {
      await sendWhatsAppMessage(from, 'Tu campaña ya está activa. ¿Querés crear una nueva? Respondé *nueva campaña*.');
      return NextResponse.json({ ok: true });
    }

    // Extraer datos del mensaje
    const updatedData = extractDataFromMessage(state.currentStep, text, state.collectedData);

    // Determinar si es una confirmación en paso 'confirming'
    const isConfirmation = state.currentStep === 'confirming' &&
      /^sí?$|^si$|^dale$|^ok$|^confirmo$|^adelante$/i.test(text.trim());

    let responseText: string;
    let nextStep = state.currentStep;

    if (isConfirmation) {
      nextStep = 'generating';
      await sendWhatsAppMessage(from, '⏳ Generando tu campaña con IA... en unos segundos la tenés lista.');

      // Marcar como 'generating' y dejar que ROBER_WB03 maneje la creación real
      // Por ahora, responder con mock
      const campaignUrl = `${process.env.APP_URL}/c/preview-demo`;
      responseText = `✅ ¡Campaña creada! Entrá acá para verla y difundirla:\n${campaignUrl}`;
      nextStep = 'done';
    } else if (state.currentStep === 'confirming' && !isConfirmation) {
      // El usuario quiere cambiar algo
      responseText = '¡Claro! ¿Qué querés modificar? Decime qué dato está mal y lo actualizamos.';
      nextStep = 'promoters'; // Volver un paso para recolectar de nuevo
    } else {
      // Avanzar al siguiente paso con Gemini
      const nextStepDerived = getNextStep(state.currentStep, updatedData);

      if (nextStepDerived === 'confirming') {
        responseText = buildSummaryMessage(updatedData);
        nextStep = 'confirming';
      } else {
        const prompt = buildAgentPrompt(state.currentStep, text, updatedData);
        const fallback = getFallbackResponse(state.currentStep);
        responseText = await callGemini(prompt, fallback);
        nextStep = nextStepDerived;
      }
    }

    await updateConversationState(from, {
      currentStep: nextStep,
      collectedData: updatedData,
    });

    await sendWhatsAppMessage(from, responseText);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET para verificación de webhook de Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('hub.challenge');
  if (challenge) return new Response(challenge, { status: 200 });
  return NextResponse.json({ ok: true });
}

function getFallbackResponse(step: string): string {
  const fallbacks: Record<string, string> = {
    greeting: '¡Hola! Soy el asistente de En Masa Social. Vamos a crear tu campaña de donación juntos. ¿Cuál es la causa que quieren financiar?',
    cause: '¡Buenísimo! ¿Cuánto necesitan recaudar y para cuándo?',
    goal: 'Perfecto. ¿Qué representa cada donación en impacto concreto? Por ejemplo: "$5.000 = 1 kit escolar".',
    impact: '¿Querés dividir la liberación de fondos en hitos? (Por defecto lo hacemos en 4 tramos iguales, podés decirme otro número.)',
    milestones: '¿Cuáles son los nombres de las personas de tu equipo que van a difundir la campaña?',
    promoters: 'Genial. Voy a preparar un resumen para confirmar.',
  };
  return fallbacks[step] ?? '¿Podés contarme un poco más?';
}
```

---

## Archivos creados/modificados

- `src/types/conversation.ts`
- `src/lib/agent/gemini.ts`
- `src/lib/agent/prompts.ts`
- `src/lib/agent/state-machine.ts`
- `src/app/api/whatsapp/webhook/route.ts`

---

## Criterio de aceptación

- [ ] Podés tener una conversación de 5+ turnos con el agente por WhatsApp real
- [ ] El estado de la conversación se guarda en Supabase (verificar en el dashboard)
- [ ] El agente responde preguntas coherentes en español rioplatense
- [ ] Gemini falla gracefully si la API key no está (usa fallback)
- [ ] En el paso 'confirming' muestra el resumen correctamente

---

## Después de terminar este WB

→ Push: `feat: agente conversacional WhatsApp (state machine + Gemini)`  
→ Arrancar ROBER_WB03 (que completa la creación real de campaña)
