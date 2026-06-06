# ROBER_WB07 — Integración Stellar on-chain
**Owner:** Rober  
**Estado:** ⏳ Pendiente  
**Depende de:** LEO_WB02 (lib/stellar lista) + ROBER_WB03 (campaña en DB)  
**Tiempo estimado:** 1.5 horas

---

## Objetivo

Conectar las acciones del producto con el smart contract de Stellar: al crear una campaña llamar `add_campaign` + milestones, y al validar evidencia llamar `add_proof` + `validate_milestone_with_proof`.

---

## Pasos

### 1. Actualizar creación de campaña para llamar al contrato

En `src/app/api/campaign/route.ts`, después de insertar en Supabase, agregar:

```typescript
// Importar al inicio
import {
  addCampaign,
  addMilestone,
  getExplorerContractUrl,
} from '@/lib/stellar';

// Después de crear la campaña en DB y los milestones...
try {
  // Crear campaña on-chain
  const { txHash } = await addCampaign({
    campaignId: slug,
    title: generated.title,
    description: generated.description.slice(0, 200),
    goal: BigInt(Math.round(input.goalAmount * 10_000_000)), // a stroops
    minDonation: BigInt(1_000_000), // 0.1 XLM mínimo
  });

  // Actualizar con el stellar_campaign_id y tx
  await supabaseAdmin
    .from('campaigns')
    .update({
      stellar_campaign_id: slug,
      og_image_url: getExplorerContractUrl(), // usar como referencia
    })
    .eq('id', campaign.id);

  // Crear milestones on-chain
  for (const milestone of milestonesInsert) {
    const { sequence } = await addMilestone({
      campaignId: slug,
      targetAmount: BigInt(Math.round(milestone.target_amount * 10_000_000)),
      description: milestone.description.slice(0, 100),
    });

    await supabaseAdmin
      .from('milestones')
      .update({ stellar_sequence: sequence })
      .eq('campaign_id', campaign.id)
      .eq('sequence', milestone.sequence);
  }

  console.log('Campaña creada on-chain:', txHash);
} catch (stellarErr) {
  // No fallar si Stellar falla — el MVP funciona igual sin on-chain
  console.error('Stellar error (non-fatal):', stellarErr);
}
```

### 2. Crear API route para validación de milestone con proof

```typescript
// src/app/api/milestone/proof/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { addProof, validateMilestoneWithProof } from '@/lib/stellar';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const milestoneId = formData.get('milestoneId') as string;
    const campaignId = formData.get('campaignId') as string;
    const description = formData.get('description') as string;

    if (!file || !milestoneId || !campaignId) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    // 1. Subir archivo a Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `proofs/${campaignId}/${milestoneId}-${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('proofs')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('proofs')
      .getPublicUrl(fileName);

    // 2. Obtener datos del milestone
    const { data: milestone } = await supabaseAdmin
      .from('milestones')
      .select('stellar_sequence, campaigns(slug, stellar_campaign_id)')
      .eq('id', milestoneId)
      .single();

    const campaign = milestone?.campaigns as { slug: string } | null;
    const campaignSlug = campaign?.slug;
    const stellarSequence = milestone?.stellar_sequence;

    // 3. Registrar proof on-chain
    const proofId = randomUUID();
    let txHash: string | null = null;
    let explorerUrl: string | null = null;

    if (campaignSlug && stellarSequence != null) {
      try {
        const proofResult = await addProof({
          proofId,
          campaignId: campaignSlug,
          uri: publicUrl,
          description: description.slice(0, 200),
        });

        const validateResult = await validateMilestoneWithProof({
          campaignId: campaignSlug,
          milestoneSequence: stellarSequence,
          proofId,
        });

        txHash = validateResult.txHash;
        explorerUrl = validateResult.explorerUrl;
      } catch (stellarErr) {
        console.error('Stellar validation error (non-fatal):', stellarErr);
      }
    }

    // 4. Actualizar milestone en DB
    await supabaseAdmin
      .from('milestones')
      .update({
        proof_url: publicUrl,
        proof_description: description,
        status: 'validated',
        validated_at: new Date().toISOString(),
        stellar_validate_tx: txHash,
      })
      .eq('id', milestoneId);

    return NextResponse.json({ ok: true, proofUrl: publicUrl, txHash, explorerUrl });
  } catch (err) {
    console.error('Proof upload error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

### 3. Crear el bucket en Supabase Storage

En el dashboard de Supabase → Storage → New bucket:
- Name: `proofs`
- Public: **sí** (para que la URL sea pública)

---

## Archivos creados/modificados

- `src/app/api/campaign/route.ts` (actualizado con Stellar)
- `src/app/api/milestone/proof/route.ts` (nuevo)

---

## Criterio de aceptación

- [ ] Al crear una campaña por WhatsApp, aparece una transacción en Stellar Explorer
- [ ] Al subir evidencia de un milestone, la TX de validación aparece en Stellar Explorer
- [ ] Si Stellar falla (RPC caído), la campaña se crea igual en DB (non-fatal)

---

## Después de terminar este WB

→ Push: `feat: Stellar integration - campaigns y milestone validation on-chain`  
→ **SYNC 3 con Leo:** smoke test end-to-end completo

---

