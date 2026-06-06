import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDonation } from '@/lib/donations/processor';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const donateSchema = z.object({
  campaign_id: z.string().min(1),
  amount: z.number().int().positive(),
  frequency: z.enum(['one_time', 'monthly']).default('one_time'),
  donor_name: z.string().min(2).max(100),
  donor_email: z.string().email(),
  donor_phone: z.string().optional(),
  referral_code: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Fallback de simulación sin Supabase: permite el flujo end-to-end del form
  // contra campañas mock cuando no hay credenciales reales.
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        donation_id: `sim_${Date.now()}`,
        status: 'confirmed',
        simulated: true,
      },
      { status: 201 }
    );
  }

  try {
    const donation = await createDonation(parsed.data);
    return NextResponse.json({ donation_id: donation.id, status: donation.status }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar la donación';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
