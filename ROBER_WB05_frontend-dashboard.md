# ROBER_WB05 — Dashboard de la ONG
**Owner:** Rober  
**Estado:** ⏳ Pendiente  
**Depende de:** ROBER_WB03, ROBER_WB04  
**Tiempo estimado:** 1.5 horas

---

## Objetivo

Crear el dashboard interno de la ONG: métricas de recaudación, ranking de promotores, estado de milestones y acceso al kit viral. También el panel de upload de evidencia para validar milestones.

---

## Pasos

### 1. Dashboard principal

```typescript
// src/app/(dashboard)/campaign/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProgressBar from '@/components/campaign/ProgressBar';

export default async function CampaignDashboard({ params }: { params: { id: string } }) {
  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('*, milestones(*), promoters(*)')
    .eq('id', params.id)
    .single();

  if (!campaign) notFound();

  // Stats de promotores
  const { data: clicks } = await supabaseAdmin
    .from('click_events')
    .select('referral_code')
    .eq('campaign_id', params.id);

  const { data: donations } = await supabaseAdmin
    .from('donations')
    .select('referral_code, amount')
    .eq('campaign_id', params.id)
    .eq('status', 'completed');

  const pct = Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100);

  // Clicks por promotor
  const clicksByRef: Record<string, number> = {};
  clicks?.forEach(c => {
    if (c.referral_code) clicksByRef[c.referral_code] = (clicksByRef[c.referral_code] ?? 0) + 1;
  });

  const donationsByRef: Record<string, { count: number; total: number }> = {};
  donations?.forEach(d => {
    if (d.referral_code) {
      donationsByRef[d.referral_code] = donationsByRef[d.referral_code] ?? { count: 0, total: 0 };
      donationsByRef[d.referral_code].count++;
      donationsByRef[d.referral_code].total += d.amount;
    }
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-white">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <Link href={`/c/${campaign.slug}`} className="text-refinance-blue text-sm hover:underline">
            Ver landing pública →
          </Link>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          campaign.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
        }`}>
          {campaign.status === 'active' ? 'Activa' : campaign.status}
        </span>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Recaudado', value: `$${campaign.total_raised.toLocaleString('es-AR')}`, color: 'text-refinance-blue' },
          { label: 'Donantes', value: campaign.donors_count, color: 'text-white' },
          { label: 'Avance', value: `${pct}%`, color: 'text-terracotta-400' },
        ].map(m => (
          <div key={m.label} className="bg-gray-900 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-gray-400 text-sm">{m.label}</div>
          </div>
        ))}
      </div>
      <ProgressBar value={pct} />

      {/* Promotores */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Promotores</h2>
        <div className="space-y-3">
          {campaign.promoters
            ?.sort((a: { referral_code: string }, b: { referral_code: string }) =>
              (clicksByRef[b.referral_code] ?? 0) - (clicksByRef[a.referral_code] ?? 0)
            )
            .map((p: { id: string; name: string; referral_code: string }) => (
              <div key={p.id} className="bg-gray-900 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-gray-400 text-sm font-mono">?ref={p.referral_code}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {donationsByRef[p.referral_code]?.count ?? 0} donaciones
                  </div>
                  <div className="text-gray-400 text-sm">
                    {clicksByRef[p.referral_code] ?? 0} clicks
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Hitos y liberación de fondos</h2>
        <div className="space-y-3">
          {campaign.milestones
            ?.sort((a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence)
            .map((m: { id: string; sequence: number; description: string; target_amount: number; status: string }) => (
              <div key={m.id} className="bg-gray-900 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{m.description}</div>
                  <div className="text-gray-400 text-sm">
                    Meta: ${m.target_amount.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    m.status === 'validated' ? 'bg-green-900 text-green-300' :
                    m.status === 'reached' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {m.status === 'pending' ? 'Pendiente' :
                     m.status === 'reached' ? 'Meta alcanzada' :
                     m.status === 'validated' ? 'Validado ✅' : m.status}
                  </span>
                  {m.status === 'reached' && (
                    <Link
                      href={`/dashboard/campaign/${params.id}/milestones?milestone=${m.id}`}
                      className="text-refinance-blue text-sm hover:underline"
                    >
                      Subir evidencia →
                    </Link>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Panel de upload de evidencia para milestone

```typescript
// src/app/(dashboard)/campaign/[id]/milestones/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MilestoneProofUpload({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ txHash?: string; explorerUrl?: string } | null>(null);
  const searchParams = useSearchParams();
  const milestoneId = searchParams.get('milestone');
  const router = useRouter();

  async function handleSubmit() {
    if (!file || !milestoneId) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('milestoneId', milestoneId);
    formData.append('campaignId', params.id);
    formData.append('description', description);

    const res = await fetch('/api/milestone/proof', { method: 'POST', body: formData });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-white">
      <h1 className="text-2xl font-bold mb-6">Cargar evidencia del hito</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Archivo de evidencia (foto/PDF/factura)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-300 file:bg-refinance-blue file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Descripción de la evidencia</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Factura de compra de 100 kits escolares de fecha..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full bg-refinance-blue hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {loading ? '⏳ Validando on-chain...' : '✅ Validar hito y liberar fondos'}
        </button>

        {result?.explorerUrl && (
          <div className="bg-green-900 rounded-xl p-4">
            <div className="text-green-300 font-semibold">¡Hito validado on-chain! 🎉</div>
            <a href={result.explorerUrl} target="_blank" className="text-green-400 text-sm hover:underline">
              Ver en Stellar Explorer →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Archivos creados/modificados

- `src/app/(dashboard)/campaign/[id]/page.tsx`
- `src/app/(dashboard)/campaign/[id]/milestones/page.tsx`
- `src/app/(dashboard)/layout.tsx` (layout básico con header de dashboard)

---

## Criterio de aceptación

- [ ] Dashboard muestra métricas reales de Supabase
- [ ] Ranking de promotores ordenado por clicks
- [ ] Milestones se listan con estado correcto
- [ ] El panel de evidencia permite seleccionar archivo y mandarlo

---

## Después de terminar este WB

→ Push: `feat: dashboard ONG con métricas, promotores y milestones`

---

