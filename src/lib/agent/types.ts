export type ConversationStep =
  | 'greeting'
  | 'collect_cause'
  | 'collect_goal'
  | 'collect_milestones'
  | 'generating'
  | 'confirming'
  | 'done'
  | 'error';

export interface MilestoneInput {
  sequence: number;
  target_amount: number;
  description: string;
}

export interface CollectedData {
  ong_name?: string;
  contact_name?: string;
  cause?: string;
  description?: string;
  goal_amount?: number;
  deadline?: string;
  milestones?: MilestoneInput[];
  // Generado por Gemini
  title?: string;
  impact_per_amount?: Record<string, string>;
  content_assets?: ContentAssetDraft[];
}

export interface ContentAssetDraft {
  channel: 'whatsapp' | 'instagram' | 'twitter' | 'facebook';
  audience: string;
  content: string;
}

export interface AgentState {
  phone_number: string;
  ong_id: string | null;
  current_step: ConversationStep;
  collected_data: CollectedData;
  campaign_id: string | null;
}

export interface AgentResponse {
  message: string;
  next_step: ConversationStep;
  updated_data: CollectedData;
}
