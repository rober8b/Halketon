import { supabaseAdmin } from '@/lib/supabase/client';
import type { AgentState, CollectedData, MilestoneInput } from './types';
import type { GeneratedCampaign } from './prompts';

function generateSlug(title: string, ongName: string): string {
  const base = `${ongName}-${title}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base}-${Date.now().toString(36)}`;
}

export async function upsertOng(
  phoneNumber: string,
  ongName: string,
  contactName: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('ongs')
    .upsert(
      { phone_number: phoneNumber, name: ongName, contact_name: contactName },
      { onConflict: 'phone_number' }
    )
    .select('id')
    .single();

  if (error) throw new Error(`Error al registrar ONG: ${error.message}`);
  return data.id;
}

export async function createCampaignWithAssets(
  ongId: string,
  data: CollectedData,
  generated: GeneratedCampaign
): Promise<{ campaignId: string; slug: string }> {
  const slug = generateSlug(generated.title, data.ong_name ?? 'ong');

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .insert({
      ong_id: ongId,
      slug,
      title: generated.title,
      cause: data.cause,
      description: generated.description,
      goal_amount: data.goal_amount,
      deadline: data.deadline,
      impact_per_amount: generated.impact_per_amount,
      status: 'draft',
    })
    .select('id')
    .single();

  if (campaignError) throw new Error(`Error al crear campaña: ${campaignError.message}`);
  const campaignId = campaign.id;

  if (data.milestones && data.milestones.length > 0) {
    const milestonesRows = data.milestones.map((m: MilestoneInput) => ({
      campaign_id: campaignId,
      sequence: m.sequence,
      target_amount: m.target_amount,
      description: m.description,
      status: 'pending',
    }));
    const { error: msError } = await supabaseAdmin.from('milestones').insert(milestonesRows);
    if (msError) throw new Error(`Error al crear milestones: ${msError.message}`);
  }

  if (generated.content_assets && generated.content_assets.length > 0) {
    const assetsRows = generated.content_assets.map((a) => ({
      campaign_id: campaignId,
      channel: a.channel,
      audience: a.audience,
      content: a.content,
    }));
    const { error: assetsError } = await supabaseAdmin.from('content_assets').insert(assetsRows);
    if (assetsError) throw new Error(`Error al guardar assets virales: ${assetsError.message}`);
  }

  return { campaignId, slug };
}

export async function saveConversationState(state: AgentState): Promise<void> {
  const { error } = await supabaseAdmin.from('conversation_state').upsert(
    {
      phone_number: state.phone_number,
      ong_id: state.ong_id,
      current_step: state.current_step,
      collected_data: state.collected_data,
      campaign_id: state.campaign_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone_number' }
  );
  if (error) throw new Error(`Error al guardar estado: ${error.message}`);
}

export async function loadConversationState(phoneNumber: string): Promise<AgentState> {
  const { data, error } = await supabaseAdmin
    .from('conversation_state')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (error) throw new Error(`Error al cargar estado: ${error.message}`);

  if (!data) {
    return {
      phone_number: phoneNumber,
      ong_id: null,
      current_step: 'greeting',
      collected_data: {},
      campaign_id: null,
    };
  }

  return {
    phone_number: data.phone_number,
    ong_id: data.ong_id,
    current_step: data.current_step,
    collected_data: data.collected_data as CollectedData,
    campaign_id: data.campaign_id,
  };
}

export async function publishCampaign(campaignId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId);
  if (error) throw new Error(`Error al publicar campaña: ${error.message}`);
}
