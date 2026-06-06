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

// Schema del payload de mensaje entrante
const incomingMessageSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  type: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                })
              )
              .optional(),
          }),
        })
      ),
    })
  ),
});

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

  const parsed = incomingMessageSchema.safeParse(body);
  if (!parsed.success) {
    // Siempre responder 200 a Meta para evitar reintentos
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  // Procesamos en background para no bloquear la respuesta a Meta
  const processPromise = (async () => {
    const client = getWhatsAppClient();

    for (const entry of parsed.data.entry) {
      for (const change of entry.changes) {
        const messages = change.value.messages ?? [];
        for (const msg of messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const phoneNumber = msg.from;
          const text = msg.text.body.trim();

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
      }
    }
  })();

  // Esperamos el procesamiento (Vercel no ejecuta after-response sin wrapping especial)
  await processPromise;

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
