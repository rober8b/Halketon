# ROBER_WB04 — Frontend público: landing de campaña + difusión
**Owner:** Leo (puede tomar este WB cuando termina LEO_WB02) / Rober como fallback  
**Estado:** ⏳ Pendiente  
**Depende de:** ROBER_WB03 (endpoints y DB listos)  
**Tiempo estimado:** 2 horas

---

## Objetivo

Construir la landing pública de la campaña (`/c/[slug]`) y el botón de difusión en todos los canales. Esta es la página que el donante ve cuando hace click al link que mandó el agente por WhatsApp.

---

## Pasos

### 1. Crear la landing pública

```typescript
// src/app/(public)/c/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import ProgressBar from '@/components/campaign/ProgressBar';
import MilestonesList from '@/components/campaign/MilestonesList';
import SharePanel from '@/components/viral-kit/SharePanel';
import DonateButton from '@/components/campaign/DonateButton';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabaseAdmin
    .from('campaigns')
    .select('title, description')
    .eq('slug', params.slug)
    .single();

  return {
    title: data?.title ?? 'Campaña de donación',
    description: data?.description ?? '',
    openGraph: {
      title: data?.title,
      description: data?.description,
    },
  };
}

export default async function CampaignLanding({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  // Registrar click si viene con referral code
  const ref = searchParams.ref;

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('*, milestones(*), content_assets(*), promoters(*)')
    .eq('slug', params.slug)
    .single();

  if (!campaign) notFound();

  const pct = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-refinance-blue text-sm font-semibold mb-2 uppercase tracking-wide">
          {campaign.cause}
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">{campaign.title}</h1>
        <p className="text-gray-300 text-lg mb-8">{campaign.description}</p>

        {/* Progress */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Recaudado</span>
            <span>{pct}% de la meta</span>
          </div>
          <ProgressBar value={pct} />
          <div className="flex justify-between mt-3">
            <span className="text-2xl font-bold text-white">
              ${campaign.total_raised.toLocaleString('es-AR')}
            </span>
            <span className="text-gray-400">
              de ${campaign.goal_amount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="text-gray-500 text-sm mt-1">
            {campaign.donors_count} donantes · hasta {campaign.deadline}
          </div>
        </div>

        {/* Impact amounts */}
        {campaign.impact_per_amount && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Tu impacto</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(campaign.impact_per_amount as Record<string, string>).map(
                ([amount, impact]) => (
                  <div key={amount} className="bg-gray-900 rounded-xl p-4">
                    <div className="text-refinance-blue font-bold">
                      ${parseInt(amount).toLocaleString('es-AR')}
                    </div>
                    <div className="text-gray-300 text-sm">{impact}</div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* CTA de donación */}
        <DonateButton campaignSlug={params.slug} refCode={ref} />

        {/* Milestones */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Hitos del proyecto</h2>
          <MilestonesList milestones={campaign.milestones ?? []} />
        </div>

        {/* Share panel */}
        <div className="mt-10">
          <SharePanel
            campaign={campaign}
            promoters={campaign.promoters ?? []}
            contentAssets={campaign.content_assets ?? []}
          />
        </div>
      </div>
    </div>
  );
}
```

### 2. Crear `src/components/campaign/ProgressBar.tsx`

```typescript
// src/components/campaign/ProgressBar.tsx
export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-3">
      <div
        className="bg-refinance-blue h-3 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
```

### 3. Crear `src/components/campaign/MilestonesList.tsx`

```typescript
// src/components/campaign/MilestonesList.tsx
const statusIcons: Record<string, string> = {
  pending: '⏳',
  reached: '🎯',
  validated: '✅',
  withdrawn: '💸',
};

export default function MilestonesList({
  milestones,
}: {
  milestones: Array<{
    sequence: number;
    description: string;
    target_amount: number;
    status: string;
    proof_url?: string;
    validated_at?: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {milestones
        .sort((a, b) => a.sequence - b.sequence)
        .map((m) => (
          <div key={m.sequence} className="bg-gray-900 rounded-xl p-4 flex gap-4">
            <div className="text-2xl">{statusIcons[m.status] ?? '⏳'}</div>
            <div className="flex-1">
              <div className="font-medium">{m.description}</div>
              <div className="text-gray-400 text-sm">
                Meta: ${m.target_amount.toLocaleString('es-AR')}
              </div>
              {m.status === 'validated' && m.proof_url && (
                <a
                  href={m.proof_url}
                  target="_blank"
                  className="text-refinance-blue text-sm hover:underline"
                >
                  Ver evidencia →
                </a>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
```

### 4. Crear `src/components/campaign/DonateButton.tsx`

```typescript
// src/components/campaign/DonateButton.tsx
'use client';
import Link from 'next/link';

export default function DonateButton({
  campaignSlug,
  refCode,
}: {
  campaignSlug: string;
  refCode?: string;
}) {
  const href = `/donate/${campaignSlug}${refCode ? `?ref=${refCode}` : ''}`;
  return (
    <Link
      href={href}
      className="block w-full bg-refinance-blue hover:bg-blue-500 text-white text-center font-bold text-xl py-4 rounded-2xl transition-colors"
    >
      💙 Donar ahora
    </Link>
  );
}
```

### 5. Crear `src/components/viral-kit/SharePanel.tsx`

```typescript
// src/components/viral-kit/SharePanel.tsx
'use client';
import { useState } from 'react';

interface Campaign {
  id: string;
  slug: string;
  title: string;
}

interface Promoter {
  id: string;
  name: string;
  referral_code: string;
}

interface ContentAsset {
  channel: string;
  content: string;
}

function buildShareUrl(slug: string, refCode: string, baseUrl: string) {
  return `${baseUrl}/c/${slug}?ref=${refCode}`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

export default function SharePanel({
  campaign,
  promoters,
  contentAssets,
}: {
  campaign: Campaign;
  promoters: Promoter[];
  contentAssets: ContentAsset[];
}) {
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(
    promoters[0] ?? null
  );

  const waContent = contentAssets.find(a => a.channel === 'whatsapp')?.content ?? '';
  const igContent = contentAssets.find(a => a.channel === 'instagram')?.content ?? '';
  const liContent = contentAssets.find(a => a.channel === 'linkedin')?.content ?? '';
  const emailContent = contentAssets.find(a => a.channel === 'email')?.content ?? '';

  function buildPersonalizedContent(content: string, promoter: Promoter | null) {
    const name = promoter?.name ?? 'Mi equipo';
    const link = promoter
      ? buildShareUrl(campaign.slug, promoter.referral_code, APP_URL)
      : `${APP_URL}/c/${campaign.slug}`;
    return content.replace('{{PROMOTER_NAME}}', name) + `\n${link}`;
  }

  function shareOnWhatsApp() {
    if (!selectedPromoter) return;
    const text = buildPersonalizedContent(waContent, selectedPromoter);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function shareOnLinkedIn() {
    const url = selectedPromoter
      ? buildShareUrl(campaign.slug, selectedPromoter.referral_code, APP_URL)
      : `${APP_URL}/c/${campaign.slug}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }

  async function copyToClipboard(text: string, channel: string) {
    const content = buildPersonalizedContent(text, selectedPromoter);
    await navigator.clipboard.writeText(content);
    alert(`✅ Copiado para ${channel}. Pegalo en tu post.`);
  }

  function shareByEmail() {
    const [subject, ...body] = emailContent.split('\n\n');
    const bodyWithLink = buildPersonalizedContent(body.join('\n\n'), selectedPromoter);
    window.open(
      `mailto:?subject=${encodeURIComponent(subject.replace('Asunto: ', ''))}&body=${encodeURIComponent(bodyWithLink)}`,
      '_blank'
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Difundir campaña</h2>

      {/* Selector de promotor */}
      {promoters.length > 1 && (
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">¿Quién difunde?</label>
          <div className="flex flex-wrap gap-2">
            {promoters.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPromoter(p)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedPromoter?.id === p.id
                    ? 'bg-refinance-blue border-refinance-blue text-white'
                    : 'border-gray-600 text-gray-400 hover:border-refinance-blue'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botones de difusión */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={shareOnWhatsApp}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <span>💬</span> WhatsApp
        </button>
        <button
          onClick={() => copyToClipboard(igContent, 'Instagram')}
          className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <span>📸</span> Instagram
        </button>
        <button
          onClick={shareOnLinkedIn}
          className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <span>💼</span> LinkedIn
        </button>
        <button
          onClick={shareByEmail}
          className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <span>✉️</span> Email
        </button>
      </div>
    </div>
  );
}
```

### 6. Registrar clicks de promotores

```typescript
// src/app/api/promoter/click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  const { campaignId, referralCode, channel } = await req.json();
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  await supabaseAdmin.from('click_events').insert({
    campaign_id: campaignId,
    referral_code: referralCode,
    channel,
    user_agent: req.headers.get('user-agent') ?? '',
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true });
}
```

---

## Archivos creados/modificados

- `src/app/(public)/c/[slug]/page.tsx`
- `src/components/campaign/ProgressBar.tsx`
- `src/components/campaign/MilestonesList.tsx`
- `src/components/campaign/DonateButton.tsx`
- `src/components/viral-kit/SharePanel.tsx`
- `src/app/api/promoter/click/route.ts`

---

## Criterio de aceptación

- [ ] La landing `/c/[slug]` carga una campaña real de Supabase
- [ ] La barra de progreso se ve correctamente
- [ ] Los milestones se listan en orden
- [ ] El botón de WhatsApp abre `wa.me` con el mensaje correcto y el link del promotor
- [ ] El preview de WhatsApp se ve cuando mandás el link por WhatsApp (OG image)

---

## Después de terminar este WB

→ Push: `feat: landing pública de campaña, SharePanel, promoter click tracking`  
→ Avisar a Rober para continuar con ROBER_WB05 (dashboard)
