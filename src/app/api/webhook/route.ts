import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processMessage, handleSpecialCommands } from '@/lib/agent/state-machine';
import { GREETING_PROMPT } from '@/lib/agent/prompts';
import { getWhatsAppClient, PHONE_NUMBER_ID } from '@/lib/whatsapp-client';

// Schema de verificación de WhatsApp
const verifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

// Estructura tolerante: aceptamos tanto el formato crudo de Meta como el de
// Kapso (kind=kapso, v2). Campos opcionales para navegar con optional chaining.
interface LooseText {
  body?: string;
}
interface LooseMessage {
  from?: string;
  type?: string;
  text?: LooseText;
}
interface LooseChange {
  value?: { messages?: LooseMessage[] };
}
interface LooseEntry {
  changes?: LooseChange[];
}
interface LooseBody {
  message?: LooseMessage;
  messages?: LooseMessage[];
  data?: { message?: LooseMessage; messages?: LooseMessage[] };
  entry?: LooseEntry[];
}

// Extrae { from, text } de cualquiera de los formatos soportados.
function extractMessages(body: unknown): { from: string; text: string }[] {
  const out: { from: string; text: string }[] = [];
  if (!body || typeof body !== 'object') return out;
  const b = body as LooseBody;

  const push = (m?: LooseMessage) => {
    if (m?.from && m.text?.body) {
      out.push({ from: String(m.from), text: String(m.text.body) });
    }
  };

  // Formato Kapso v2: { message } o { data: { message } } (+ variantes con array)
  push(b.message);
  push(b.data?.message);
  for (const m of b.messages ?? []) push(m);
  for (const m of b.data?.messages ?? []) push(m);

  // Formato Meta (passthrough)
  for (const entry of b.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) push(m);
    }
  }

  // Dedupe por from+text (evita procesar el mismo mensaje dos veces)
  const seen = new Set<string>();
  return out.filter((m) => {
    const key = `${m.from}|${m.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// GET — verificación del webhook de Meta/Kapso
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = verifySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  const verifyToken =
    (process.env.WEBHOOK_VERIFY_TOKEN ?? '').replace(/^﻿/, '').trim() || 'en-masa-social';
  if (parsed.data['hub.verify_token'] !== verifyToken) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 });
  }

  return new NextResponse(parsed.data['hub.challenge'], { status: 200 });
}

// POST — mensajes entrantes
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const incoming = extractMessages(body);
  if (incoming.length === 0) {
    // Eventos sin mensajes de texto (delivery, read, etc.) — responder 200 e ignorar.
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  const client = getWhatsAppClient();

  for (const { from: phoneNumber, text: rawText } of incoming) {
    const text = rawText.trim();
    if (!text) continue;

    try {
      // Comandos especiales primero
      const specialReply = await handleSpecialCommands(phoneNumber, text);
      const replyText = specialReply ?? (await processMessage(phoneNumber, text));

      if (replyText) {
        await client.messages.sendText({
          phoneNumberId: PHONE_NUMBER_ID,
          to: phoneNumber,
          body: replyText,
        });
      }
    } catch (err) {
      console.error(`[webhook] Error procesando mensaje de ${phoneNumber}:`, err);
      try {
        await client.messages.sendText({
          phoneNumberId: PHONE_NUMBER_ID,
          to: phoneNumber,
          body: '😕 Ocurrió un error. Escribí "reiniciar" para intentarlo de nuevo.',
        });
      } catch {
        // Si falla el envío del error, nada más podemos hacer
      }
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
