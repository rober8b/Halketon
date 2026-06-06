import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processMessage, handleSpecialCommands } from '@/lib/agent/state-machine';

// Endpoint TEMPORAL de prueba: simula un mensaje entrante de WhatsApp
// y devuelve la respuesta del agente, sin pasar por Kapso.
// Útil para smoke test cuando el sandbox de Kapso no está activado.

const schema = z.object({
  phone: z.string().min(3),
  text: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Faltan phone o text' }, { status: 400 });
  }

  const { phone, text } = parsed.data;

  try {
    const special = await handleSpecialCommands(phone, text);
    const reply = special ?? (await processMessage(phone, text));
    return NextResponse.json({ reply }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
