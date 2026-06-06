export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused';
export type MilestoneStatus = 'pending' | 'completed' | 'reached' | 'validated';
export type ContentChannel =
  | 'whatsapp'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'email';

export interface Milestone {
  id: string;
  sequence: number;
  target_amount: number;
  description: string;
  status: MilestoneStatus;
  proof_url: string | null;
  proof_description: string | null;
  validated_at: string | null;
}

export interface ContentAsset {
  id: string;
  channel: ContentChannel;
  audience: string;
  content: string;
  version?: number;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  cause: string;
  description: string;
  goal_amount: number;
  total_raised: number;
  donors_count: number;
  min_donation: number;
  deadline: string | null;
  status: CampaignStatus;
  impact_per_amount: Record<string, string>;
  og_image_url: string | null;
  milestones: Milestone[];
  content_assets: ContentAsset[];
  created_at: string;
}

export type CampaignPublic = Pick<
  Campaign,
  | 'id'
  | 'slug'
  | 'title'
  | 'cause'
  | 'description'
  | 'goal_amount'
  | 'total_raised'
  | 'donors_count'
  | 'min_donation'
  | 'deadline'
  | 'status'
  | 'impact_per_amount'
  | 'og_image_url'
  | 'milestones'
>;

export interface CampaignPromoter {
  id: string;
  name: string;
  type: 'volunteer' | 'partner' | 'staff';
  referral_code: string;
  clicks: number;
  donations: number;
  total_raised: number;
}

export interface CampaignWithRelations extends Campaign {
  promoters: CampaignPromoter[];
  lead_contact: string;
  location: string;
  summary: string;
  updated_at: string;
}
