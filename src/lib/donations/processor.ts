import { supabaseAdmin } from '@/lib/supabase/client';
import type { DonationInput, Donation } from '@/types/donation';
import { donateOnChain } from '@/lib/stellar/contract';

export async function createDonation(input: DonationInput): Promise<Donation> {
  // 1. Verificar que la campaña existe y está activa
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('id, status, min_donation, goal_amount')
    .eq('id', input.campaign_id)
    .single();

  if (campaignError || !campaign) {
    throw new Error('Campaña no encontrada');
  }
  if (campaign.status !== 'active') {
    throw new Error('La campaña no está activa');
  }
  if (input.amount < campaign.min_donation) {
    throw new Error(`El monto mínimo de donación es $${campaign.min_donation}`);
  }

  // 2. Validar referral_code si viene
  if (input.referral_code) {
    const { data: promoter } = await supabaseAdmin
      .from('promoters')
      .select('id')
      .eq('referral_code', input.referral_code)
      .eq('campaign_id', input.campaign_id)
      .maybeSingle();

    if (!promoter) {
      // Ignoramos el código inválido en lugar de fallar
      input.referral_code = undefined;
    }
  }

  // 3. Crear el registro de donación en estado pending
  const { data: donation, error: insertError } = await supabaseAdmin
    .from('donations')
    .insert({
      campaign_id: input.campaign_id,
      amount: input.amount,
      frequency: input.frequency,
      donor_name: input.donor_name,
      donor_email: input.donor_email,
      donor_phone: input.donor_phone ?? null,
      referral_code: input.referral_code ?? null,
      status: 'pending',
      payment_provider: 'simulated',
    })
    .select()
    .single();

  if (insertError || !donation) {
    throw new Error(`Error al registrar donación: ${insertError?.message}`);
  }

  // 4. Simular confirmación de pago
  const paymentId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 5. Registrar donación on-chain (graceful — no bloquea si Stellar no está configurado)
  const { data: campaignData } = await supabaseAdmin
    .from('campaigns')
    .select('stellar_campaign_id')
    .eq('id', input.campaign_id)
    .single();

  let stellarTxHash: string | null = null;
  if (campaignData?.stellar_campaign_id) {
    try {
      stellarTxHash = await donateOnChain({
        stellarCampaignId: campaignData.stellar_campaign_id,
        amount: input.amount,
      });
    } catch (err) {
      console.error('[donations] Error Stellar — donación confirmada igual:', err);
    }
  }

  const { error: confirmError } = await supabaseAdmin
    .from('donations')
    .update({
      status: 'confirmed',
      payment_id: paymentId,
      stellar_tx_hash: stellarTxHash,
    })
    .eq('id', donation.id);

  if (confirmError) {
    throw new Error(`Error al confirmar pago: ${confirmError.message}`);
  }

  // 6. Incrementar totales de la campaña (atómico vía SQL function)
  const { error: rpcError } = await supabaseAdmin.rpc('increment_campaign_totals', {
    p_campaign_id: input.campaign_id,
    p_amount: input.amount,
  });

  if (rpcError) {
    console.error('[donations] Error al incrementar totales:', rpcError);
  }

  return { ...donation, status: 'confirmed', payment_id: paymentId, stellar_tx_hash: stellarTxHash };
}

export async function getDonationsByCampaign(campaignId: string): Promise<Donation[]> {
  const { data, error } = await supabaseAdmin
    .from('donations')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener donaciones: ${error.message}`);
  return (data ?? []) as Donation[];
}
