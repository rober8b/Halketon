import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignPromoter,
  CampaignWithRelations,
  ContentAsset,
  ContentChannel,
  Milestone,
  MilestoneStatus,
} from '@/types/campaign';
import {
  getMockCampaignById,
  getMockCampaignBySlug,
  listMockCampaigns,
} from '@/lib/mock-campaigns';

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDeadline(value: string | null | undefined): string {
  if (!value) return 'Sin fecha definida';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFmt.format(parsed);
}

type CampaignRow = {
  id: string;
  ong_id: string | null;
  slug: string;
  title: string;
  cause: string;
  description: string;
  goal_amount: number;
  min_donation: number;
  deadline: string | null;
  status: string;
  impact_per_amount: Record<string, string> | null;
  og_image_url: string | null;
  total_raised: number | null;
  donors_count: number | null;
  created_at: string;
};

type MilestoneRow = {
  id: string;
  sequence: number;
  target_amount: number;
  description: string;
  status: string;
  proof_url: string | null;
  proof_description: string | null;
  validated_at: string | null;
};

type ContentAssetRow = {
  id: string;
  channel: string;
  audience: string | null;
  content: string;
  version: number | null;
};

type PromoterRow = {
  id: string;
  name: string;
  type: string;
  referral_code: string;
};

type OngRow = { name: string | null; contact_name: string | null };

function mapMilestones(rows: MilestoneRow[] | null): Milestone[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((row) => ({
      id: row.id,
      sequence: row.sequence,
      target_amount: row.target_amount,
      description: row.description,
      status: (row.status as MilestoneStatus) ?? 'pending',
      proof_url: row.proof_url,
      proof_description: row.proof_description,
      validated_at: row.validated_at,
    }));
}

function mapContentAssets(rows: ContentAssetRow[] | null): ContentAsset[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    channel: (row.channel as ContentChannel) ?? 'whatsapp',
    audience: row.audience ?? '',
    content: row.content,
    version: row.version ?? 1,
  }));
}

function mapPromoters(rows: PromoterRow[] | null): CampaignPromoter[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: (row.type as CampaignPromoter['type']) ?? 'volunteer',
    referral_code: row.referral_code,
    clicks: 0,
    donations: 0,
    total_raised: 0,
  }));
}

function rowToCampaign(
  row: CampaignRow,
  milestones: MilestoneRow[] | null,
  assets: ContentAssetRow[] | null,
  promoters: PromoterRow[] | null,
  ong: OngRow | null
): CampaignWithRelations {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    cause: row.cause,
    description: row.description,
    goal_amount: row.goal_amount,
    total_raised: row.total_raised ?? 0,
    donors_count: row.donors_count ?? 0,
    min_donation: row.min_donation,
    deadline: formatDeadline(row.deadline),
    status: (row.status as CampaignWithRelations['status']) ?? 'draft',
    impact_per_amount: row.impact_per_amount ?? {},
    og_image_url: row.og_image_url,
    milestones: mapMilestones(milestones),
    content_assets: mapContentAssets(assets),
    promoters: mapPromoters(promoters),
    lead_contact: ong?.contact_name ?? ong?.name ?? 'Equipo de la ONG',
    location: 'Argentina',
    summary:
      row.description.length > 220
        ? `${row.description.slice(0, 217).trim()}…`
        : row.description,
    updated_at: row.created_at,
    created_at: row.created_at,
  };
}

const CAMPAIGN_SELECT = `
  id, ong_id, slug, title, cause, description,
  goal_amount, min_donation, deadline, status,
  impact_per_amount, og_image_url, total_raised, donors_count, created_at,
  milestones (
    id, sequence, target_amount, description, status,
    proof_url, proof_description, validated_at
  ),
  content_assets ( id, channel, audience, content, version ),
  promoters ( id, name, type, referral_code )
`;

type CampaignWithJoins = CampaignRow & {
  milestones: MilestoneRow[] | null;
  content_assets: ContentAssetRow[] | null;
  promoters: PromoterRow[] | null;
};

async function fetchOng(admin: SupabaseClient, ongId: string | null): Promise<OngRow | null> {
  if (!ongId) return null;
  const { data } = await admin
    .from('ongs')
    .select('name, contact_name')
    .eq('id', ongId)
    .maybeSingle();
  return (data as OngRow) ?? null;
}

export async function getCampaignBySlug(slug: string): Promise<CampaignWithRelations | null> {
  const admin = getAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('campaigns')
        .select(CAMPAIGN_SELECT)
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        const row = data as unknown as CampaignWithJoins;
        const ong = await fetchOng(admin, row.ong_id);
        return rowToCampaign(row, row.milestones, row.content_assets, row.promoters, ong);
      }
    } catch (err) {
      console.warn('[campaigns/queries] Supabase falló, fallback a mock:', err);
    }
  }
  return getMockCampaignBySlug(slug) ?? null;
}

export async function getCampaignById(id: string): Promise<CampaignWithRelations | null> {
  const admin = getAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('campaigns')
        .select(CAMPAIGN_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const row = data as unknown as CampaignWithJoins;
        const ong = await fetchOng(admin, row.ong_id);
        return rowToCampaign(row, row.milestones, row.content_assets, row.promoters, ong);
      }
    } catch (err) {
      console.warn('[campaigns/queries] Supabase falló, fallback a mock:', err);
    }
  }
  return getMockCampaignById(id) ?? null;
}

export async function listCampaigns(): Promise<CampaignWithRelations[]> {
  const admin = getAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('campaigns')
        .select(CAMPAIGN_SELECT)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const rows = data as unknown as CampaignWithJoins[];
        const ongIds = Array.from(new Set(rows.map((row) => row.ong_id).filter(Boolean) as string[]));
        const { data: ongs } = await admin
          .from('ongs')
          .select('id, name, contact_name')
          .in('id', ongIds.length > 0 ? ongIds : ['00000000-0000-0000-0000-000000000000']);
        const ongMap = new Map<string, OngRow>();
        for (const ong of (ongs as Array<{ id: string } & OngRow> | null) ?? []) {
          ongMap.set(ong.id, { name: ong.name, contact_name: ong.contact_name });
        }
        return rows.map((row) =>
          rowToCampaign(
            row,
            row.milestones,
            row.content_assets,
            row.promoters,
            row.ong_id ? ongMap.get(row.ong_id) ?? null : null
          )
        );
      }
    } catch (err) {
      console.warn('[campaigns/queries] Supabase falló, fallback a mock:', err);
    }
  }
  return listMockCampaigns();
}

export async function listCampaignSlugs(): Promise<string[]> {
  const admin = getAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.from('campaigns').select('slug');
      if (!error && data) {
        const slugs = (data as Array<{ slug: string }>).map((row) => row.slug);
        if (slugs.length > 0) return slugs;
      }
    } catch (err) {
      console.warn('[campaigns/queries] Supabase falló, fallback a mock:', err);
    }
  }
  return listMockCampaigns().map((c) => c.slug);
}

export async function listCampaignIds(): Promise<string[]> {
  const admin = getAdmin();
  if (admin) {
    try {
      const { data, error } = await admin.from('campaigns').select('id');
      if (!error && data) {
        const ids = (data as Array<{ id: string }>).map((row) => row.id);
        if (ids.length > 0) return ids;
      }
    } catch (err) {
      console.warn('[campaigns/queries] Supabase falló, fallback a mock:', err);
    }
  }
  return listMockCampaigns().map((c) => c.id);
}
