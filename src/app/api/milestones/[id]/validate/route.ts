import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { validateMilestoneOnChain } from '@/lib/stellar/contract';

const bodySchema = z.object({
  proof_url: z.string().url().optional(),
  proof_description: z.string().min(10).max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 422 });
  }

  // Cargar milestone + campaign
  const { data: milestone, error: msError } = await supabaseAdmin
    .from('milestones')
    .select('id, campaign_id, sequence, status, stellar_sequence')
    .eq('id', id)
    .single();

  if (msError || !milestone) {
    return NextResponse.json({ error: 'Milestone no encontrado' }, { status: 404 });
  }
  if (milestone.status === 'completed') {
    return NextResponse.json({ error: 'El milestone ya fue validado' }, { status: 409 });
  }

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('stellar_campaign_id')
    .eq('id', milestone.campaign_id)
    .single();

  // Validar on-chain si el contrato está configurado
  let stellarTxHash: string | null = null;
  if (campaign?.stellar_campaign_id) {
    try {
      stellarTxHash = await validateMilestoneOnChain({
        stellarCampaignId: campaign.stellar_campaign_id,
        milestoneSequence: milestone.stellar_sequence ?? milestone.sequence,
      });
    } catch (err) {
      console.error('[milestone] Error Stellar validate:', err);
      return NextResponse.json(
        { error: `Error al validar on-chain: ${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }
  }

  // Actualizar milestone en DB
  const { error: updateError } = await supabaseAdmin
    .from('milestones')
    .update({
      status: 'completed',
      proof_url: parsed.data.proof_url ?? null,
      proof_description: parsed.data.proof_description ?? null,
      validated_at: new Date().toISOString(),
      stellar_validate_tx: stellarTxHash,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: 'Error al actualizar milestone' }, { status: 500 });
  }

  return NextResponse.json({ success: true, stellar_tx_hash: stellarTxHash });
}
