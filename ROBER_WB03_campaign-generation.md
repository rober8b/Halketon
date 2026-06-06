# ROBER_WB03 — Generación de campaña + kit viral + OG image
**Owner:** Rober  
**Estado:** ⏳ Pendiente  
**Depende de:** ROBER_WB02  
**Tiempo estimado:** 2 horas

---

## Objetivo

Implementar la lógica de creación de campaña: cuando el agente confirma los datos, llamar a Gemini para generar la narrativa y el kit viral, guardar todo en Supabase, y mandar el link con preview de WhatsApp. Este WB completa el flujo del Acto 1 y 2 del pitch.

---

## Pasos

### 1. Crear tipos de campaña

```typescript
// src/types/campaign.ts
export interface CampaignCreateInput {
  cause: string;
  goalAmount: number;
  deadline: string;
  impactHint: string;
  milestonesCount: number;
  promoters: string[];
  ongId: string;
  phoneNumber: string;
}

export interface GeneratedCampaign {
  title: string;
  description: string;
  impactPerAmount: Record<string, string>;  // { "5000": "1 kit", "25000": "5 kits" }
  suggestedAmounts: number[];
}

export interface ViralKit {
  whatsapp: string;
  instagram: string;
  linkedin: string;
  email: string;
  corporate: string;
}
```

### 2. Crear `src/lib/agent/campaign-generator.ts`

```typescript
// src/lib/agent/campaign-generator.ts
import { callGeminiJSON } from './gemini';
import { GeneratedCampaign, ViralKit } from '@/types/campaign';

export async function generateCampaignContent(params: {
  cause: string;
  goalAmount: number;
  deadline: string;
  impactHint: string;
}): Promise<GeneratedCampaign> {
  const prompt = `Sos copywriter experto en fundraising para ONGs argentinas.
Generá contenido para esta campaña. Devolvé SOLO JSON válido, sin markdown.

Datos:
- Causa: ${params.cause}
- Monto: $${params.goalAmount.toLocaleString('es-AR')}
- Plazo: ${params.deadline}
- Impacto base: ${params.impactHint}

Devolvé exactamente este JSON:
{
  "title": "título de 6-10 palabras, emocional pero no manipulador",
  "description": "3-4 oraciones en español rioplatense, cercano y específico",
  "impactPerAmount": {
    "5000": "descripción concreta de impacto",
    "25000": "descripción concreta de impacto",
    "50000": "descripción concreta de impacto"
  },
  "suggestedAmounts": [5000, 25000, 50000, 100000]
}`;

  const fallback: GeneratedCampaign = {
    title: `Campaña: ${params.cause.slice(0, 40)}`,
    description: `Necesitamos tu ayuda para ${params.cause}. Con tu aporte llegamos a ${params.goalAmount.toLocaleString('es-AR')} pesos antes de ${params.deadline}. Cada peso cuenta.`,
    impactPerAmount: { '5000': params.impactHint, '25000': `5x ${params.impactHint}` },
    suggestedAmounts: [5000, 10000, 25000, 50000],
  };

  return callGeminiJSON(prompt, fallback);
}

export async function generateViralKit(params: {
  title: string;
  cause: string;
  goalAmount: number;
  deadline: string;
  impact: string;
}): Promise<ViralKit> {
  const prompt = `Generá mensajes para difundir esta campaña solidaria en distintos canales.
El link se agrega automáticamente al final — NO lo incluyas.
Usá {{PROMOTER_NAME}} donde iría el nombre del promotor.
Devolvé SOLO JSON válido, sin markdown.

Campaña:
- Título: ${params.title}
- Causa: ${params.cause}
- Meta: $${params.goalAmount.toLocaleString('es-AR')} para ${params.deadline}
- Impacto: ${params.impact}

JSON:
{
  "whatsapp": "mensaje corto 2-3 líneas con emoji, llamado a la acción claro",
  "instagram": "caption hasta 200 chars + 4 hashtags al final",
  "linkedin": "tono profesional 4-5 líneas foco impacto social",
  "email": "Asunto: [asunto]\\n\\n[cuerpo de 4-5 líneas]",
  "corporate": "para empresas, foco RSE y matching, 5-6 líneas"
}`;

  const fallback: ViralKit = {
    whatsapp: `🙏 Sumate a "${params.title}". Juntos llegamos a la meta.\n{{PROMOTER_NAME}} te comparte esta campaña:`,
    instagram: `Apoyá esta causa 💙 ${params.cause}. Meta: $${params.goalAmount.toLocaleString('es-AR')}. #solidaridad #ong #argentina #donaciones`,
    linkedin: `Me sumé a apoyar "${params.title}". ${params.cause}. Cada aporte hace la diferencia. Te dejo el link:`,
    email: `Asunto: Te cuento de una campaña que me parece importante\n\nHola,\n\nTe quería compartir esta iniciativa: ${params.title}. ${params.cause}. Si podés aportar algo, suma mucho.`,
    corporate: `Estimados,\n\nLos contactamos para compartir "${params.title}". Es una oportunidad de impacto social con ${params.cause}. ¿Estarían interesados en hacer un matching de donaciones?`,
  };

  return callGeminiJSON(prompt, fallback);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    + '-' + Date.now().toString(36);
}

export function generateReferralCode(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10)
    + Math.random().toString(36).slice(2, 5);
}
```

### 3. Crear API route de creación de campaña

```typescript
// src/app/api/campaign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import {
  generateCampaignContent,
  generateViralKit,
  generateSlug,
  generateReferralCode,
} from '@/lib/agent/campaign-generator';
import { CampaignCreateInput } from '@/types/campaign';
import { z } from 'zod';

const createCampaignSchema = z.object({
  cause: z.string().min(5),
  goalAmount: z.number().positive(),
  deadline: z.string(),
  impactHint: z.string(),
  milestonesCount: z.number().min(1).max(10).default(4),
  promoters: z.array(z.string()).min(1),
  ongId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = createCampaignSchema.parse(body) as CampaignCreateInput;

    // 1. Generar contenido con IA
    const [generated, viralKit] = await Promise.all([
      generateCampaignContent(input),
      generateViralKit({
        title: `Campaña: ${input.cause.slice(0, 30)}`,
        cause: input.cause,
        goalAmount: input.goalAmount,
        deadline: input.deadline,
        impact: input.impactHint,
      }),
    ]);

    // Regenerar con título real
    const finalViralKit = await generateViralKit({
      title: generated.title,
      cause: input.cause,
      goalAmount: input.goalAmount,
      deadline: input.deadline,
      impact: input.impactHint,
    });

    const slug = generateSlug(generated.title);

    // 2. Crear campaña en DB
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        ong_id: input.ongId,
        slug,
        title: generated.title,
        cause: input.cause,
        description: generated.description,
        goal_amount: input.goalAmount,
        deadline: input.deadline,
        impact_per_amount: generated.impactPerAmount,
        status: 'active',
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Error creando campaña: ${campaignError?.message}`);
    }

    // 3. Crear milestones distribuidos en tramos iguales
    const milestoneAmount = Math.floor(input.goalAmount / input.milestonesCount);
    const milestonesInsert = Array.from({ length: input.milestonesCount }, (_, i) => ({
      campaign_id: campaign.id,
      sequence: i + 1,
      target_amount: milestoneAmount * (i + 1),
      description: `Hito ${i + 1}: ${Math.round((i + 1) * 100 / input.milestonesCount)}% de la meta — ${input.impactHint}`,
    }));

    await supabaseAdmin.from('milestones').insert(milestonesInsert);

    // 4. Crear content assets (kit viral)
    const contentAssets = Object.entries(finalViralKit).map(([channel, content]) => ({
      campaign_id: campaign.id,
      channel,
      content,
    }));
    await supabaseAdmin.from('content_assets').insert(contentAssets);

    // 5. Crear promotores con referral codes
    const promotersInsert = input.promoters.map(name => ({
      campaign_id: campaign.id,
      name,
      referral_code: generateReferralCode(name),
    }));
    await supabaseAdmin.from('promoters').insert(promotersInsert);

    return NextResponse.json({
      campaignId: campaign.id,
      slug: campaign.slug,
      url: `${process.env.APP_URL}/c/${slug}`,
    });

  } catch (err) {
    console.error('Error creando campaña:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  const { data } = await supabaseAdmin
    .from('campaigns')
    .select('*, milestones(*), content_assets(*), promoters(*)')
    .eq('slug', slug)
    .single();

  if (!data) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  return NextResponse.json(data);
}
```

### 4. Actualizar el webhook para crear campaña real

En `src/app/api/whatsapp/webhook/route.ts`, reemplazar el bloque de `isConfirmation` con:

```typescript
if (isConfirmation) {
  nextStep = 'generating';
  await sendWhatsAppMessage(from, '⏳ Generando tu campaña con IA... tardamos unos segundos.');

  // Asegurar/crear ONG
  const { data: ong } = await supabaseAdmin
    .from('ongs')
    .upsert({ phone_number: from }, { onConflict: 'phone_number' })
    .select()
    .single();

  // Crear campaña vía API interna
  const campaignRes = await fetch(`${process.env.APP_URL}/api/campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cause: updatedData.cause,
      goalAmount: updatedData.goalAmount,
      deadline: updatedData.deadline,
      impactHint: updatedData.impactHint,
      milestonesCount: updatedData.milestonesCount ?? 4,
      promoters: updatedData.promoters ?? ['Equipo'],
      ongId: ong?.id,
    }),
  });

  const campaignData = await campaignRes.json();
  const campaignUrl = campaignData.url;

  responseText = `✅ ¡Tu campaña está lista!\n\nTocá el link para verla y difundirla con tu equipo:\n${campaignUrl}`;
  nextStep = 'done';

  await updateConversationState(from, {
    currentStep: 'done',
    collectedData: updatedData,
    campaignId: campaignData.campaignId,
  });
}
```

### 5. Crear OG image dinámica

```typescript
// src/app/(public)/c/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { supabaseAdmin } from '@/lib/supabase/client';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { slug: string } }) {
  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('title, description, goal_amount, total_raised, cause')
    .eq('slug', params.slug)
    .single();

  const title = campaign?.title ?? 'Campaña de donación';
  const raised = campaign?.total_raised ?? 0;
  const goal = campaign?.goal_amount ?? 1;
  const pct = Math.min(Math.round((raised / goal) * 100), 100);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ color: '#4A90E2', fontSize: 28, marginBottom: 16 }}>
          EN MASA SOCIAL
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 56,
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          {title}
        </div>
        <div
          style={{
            background: '#2a2a4e',
            borderRadius: 12,
            padding: '16px 32px',
            display: 'flex',
            gap: 32,
          }}
        >
          <span style={{ color: '#C68E5A', fontSize: 28 }}>
            💰 ${goal.toLocaleString('es-AR')}
          </span>
          <span style={{ color: '#4A90E2', fontSize: 28 }}>
            📊 {pct}% alcanzado
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
```

---

## Archivos creados/modificados

- `src/types/campaign.ts`
- `src/lib/agent/campaign-generator.ts`
- `src/app/api/campaign/route.ts`
- `src/app/(public)/c/[slug]/opengraph-image.tsx`
- `src/app/api/whatsapp/webhook/route.ts` (actualizado)

---

## Criterio de aceptación

- [ ] Al confirmar en el agente, la campaña se crea en Supabase (verificar en dashboard)
- [ ] El kit viral (5 mensajes) aparece en `content_assets`
- [ ] Los promotores aparecen en la tabla `promoters` con referral codes únicos
- [ ] El link que manda el agente por WhatsApp tiene OG preview visible en WhatsApp

---

## Después de terminar este WB

→ Push: `feat: campaign generation, viral kit, OG image`  
→ **SYNC 2:** avisar a Leo que los endpoints `/api/campaign` y la estructura de DB están listos  
→ Arrancar ROBER_WB05 (dashboard) mientras Leo toma ROBER_WB04 (landing pública)
