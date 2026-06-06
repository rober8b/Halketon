# ROBER_WB06 — Donación simulada y thanks page
**Owner:** Leo (puede tomar este WB) / Rober como fallback  
**Estado:** ⏳ Pendiente  
**Depende de:** ROBER_WB04  
**Tiempo estimado:** 1.5 horas

---

## Objetivo

Implementar el flujo de donación: formulario, registro en DB, actualización de métricas de campaña, y página de agradecimiento con badge "Yo doné".

---

## Pasos

### 1. Página de donación

```typescript
// src/app/(public)/donate/[slug]/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const SUGGESTED_AMOUNTS = [5000, 10000, 25000, 50000];

export default function DonatePage({ params }: { params: { slug: string } }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  const finalAmount = amount ?? parseInt(customAmount) ?? 0;

  async function handleDonate() {
    if (!finalAmount || finalAmount < 100) return;
    setLoading(true);

    const res = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignSlug: params.slug,
        amount: finalAmount,
        frequency,
        donorName: name || 'Donante anónimo',
        donorEmail: email,
        referralCode: ref,
      }),
    });

    const { donationId } = await res.json();
    router.push(`/thanks/${donationId}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Tu aporte importa 💙</h1>

        {/* Montos sugeridos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {SUGGESTED_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => { setAmount(a); setCustomAmount(''); }}
              className={`py-3 rounded-xl font-semibold transition-colors ${
                amount === a
                  ? 'bg-refinance-blue text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              ${a.toLocaleString('es-AR')}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Otro monto en pesos"
          value={customAmount}
          onChange={e => { setCustomAmount(e.target.value); setAmount(null); }}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-4 placeholder-gray-500"
        />

        {/* Frecuencia */}
        <div className="flex gap-3 mb-6">
          {(['one_time', 'monthly'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                frequency === f ? 'bg-terracotta-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {f === 'one_time' ? 'Donación única' : '🔄 Mensual'}
            </button>
          ))}
        </div>

        {/* Datos del donante */}
        <input
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-3 placeholder-gray-500"
        />
        <input
          type="email"
          placeholder="Email (para recibir updates)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-6 placeholder-gray-500"
        />

        <button
          onClick={handleDonate}
          disabled={!finalAmount || loading}
          className="w-full bg-refinance-blue hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-xl transition-colors"
        >
          {loading ? '⏳ Procesando...' : `Donar $${finalAmount?.toLocaleString('es-AR') ?? '0'} ${frequency === 'monthly' ? '/ mes' : ''}`}
        </button>
      </div>
    </div>
  );
}
```

### 2. API route de donación

```typescript
// src/app/api/donate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';

const donateSchema = z.object({
  campaignSlug: z.string(),
  amount: z.number().positive(),
  frequency: z.enum(['one_time', 'monthly']).default('one_time'),
  donorName: z.string().default('Anónimo'),
  donorEmail: z.string().email().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = donateSchema.parse(body);

    // Obtener campaña
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, total_raised, donors_count, goal_amount, milestones(*)')
      .eq('slug', input.campaignSlug)
      .single();

    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

    // Registrar donación (simulada — status 'completed' directo)
    const { data: donation } = await supabaseAdmin
      .from('donations')
      .insert({
        campaign_id: campaign.id,
        amount: input.amount,
        frequency: input.frequency,
        donor_name: input.donorName,
        donor_email: input.donorEmail,
        referral_code: input.referralCode,
        status: 'completed',
        payment_provider: 'simulated',
      })
      .select()
      .single();

    // Actualizar totales de la campaña
    const newTotal = campaign.total_raised + input.amount;
    const newCount = campaign.donors_count + 1;

    await supabaseAdmin
      .from('campaigns')
      .update({ total_raised: newTotal, donors_count: newCount })
      .eq('id', campaign.id);

    // Verificar si algún milestone se alcanzó
    const milestones = campaign.milestones as Array<{ id: string; target_amount: number; status: string; sequence: number }>;
    for (const m of milestones.sort((a, b) => a.sequence - b.sequence)) {
      if (m.status === 'pending' && newTotal >= m.target_amount) {
        await supabaseAdmin
          .from('milestones')
          .update({ status: 'reached' })
          .eq('id', m.id);
        break; // solo el próximo milestone
      }
    }

    return NextResponse.json({ donationId: donation?.id, campaignSlug: input.campaignSlug });
  } catch (err) {
    console.error('Error donación:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

### 3. Thanks page con badge

```typescript
// src/app/(public)/thanks/[donationId]/page.tsx
import { supabaseAdmin } from '@/lib/supabase/client';
import Link from 'next/link';

export default async function ThanksPage({ params }: { params: { donationId: string } }) {
  const { data: donation } = await supabaseAdmin
    .from('donations')
    .select('*, campaigns(slug, title)')
    .eq('id', params.donationId)
    .single();

  const campaign = donation?.campaigns as { slug: string; title: string } | null;
  const shareText = `💙 Acabo de donar a "${campaign?.title}". Sumate vos también:`;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${campaign?.slug}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center text-white">
        <div className="text-7xl mb-6">💙</div>
        <h1 className="text-3xl font-bold mb-3">¡Gracias por donar!</h1>
        <p className="text-gray-300 mb-2">
          Tu aporte de <span className="text-refinance-blue font-bold">
            ${donation?.amount?.toLocaleString('es-AR')}
          </span> quedó registrado.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Los fondos quedan en escrow y se liberan cuando el proyecto cumple sus hitos.
        </p>

        {/* Badge */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border-2 border-refinance-blue">
          <div className="text-5xl mb-2">🏅</div>
          <div className="font-bold text-xl">Yo doné</div>
          <div className="text-gray-400 text-sm">a {campaign?.title}</div>
        </div>

        {/* Share */}
        <a
          href={waUrl}
          target="_blank"
          className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl mb-3 transition-colors"
        >
          💬 Compartí por WhatsApp
        </a>
        <Link
          href={`/c/${campaign?.slug}`}
          className="block text-refinance-blue hover:underline text-sm"
        >
          Ver el avance de la campaña
        </Link>
      </div>
    </div>
  );
}
```

---

## Archivos creados/modificados

- `src/app/(public)/donate/[slug]/page.tsx`
- `src/app/api/donate/route.ts`
- `src/app/(public)/thanks/[donationId]/page.tsx`

---

## Criterio de aceptación

- [ ] Podés completar una donación de principio a fin
- [ ] La donación aparece en Supabase con `status='completed'`
- [ ] El contador de `total_raised` se actualiza en la campaña
- [ ] Si se supera la meta de un milestone, cambia a `status='reached'`
- [ ] La thanks page muestra el badge y el botón de share

---

## Después de terminar este WB

→ Push: `feat: flujo de donación simulada y thanks page con badge`

---

