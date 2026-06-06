CREATE TABLE ongs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text,
  contact_name text,
  stellar_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id uuid REFERENCES ongs(id) NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  cause text NOT NULL,
  description text NOT NULL,
  goal_amount bigint NOT NULL,
  min_donation bigint DEFAULT 100000,
  deadline date,
  impact_per_amount jsonb,
  status text DEFAULT 'draft',
  stellar_campaign_id text,
  og_image_url text,
  total_raised bigint DEFAULT 0,
  donors_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  sequence int NOT NULL,
  target_amount bigint NOT NULL,
  description text NOT NULL,
  stellar_sequence int,
  proof_url text,
  proof_description text,
  status text DEFAULT 'pending',
  validated_at timestamptz,
  stellar_validate_tx text,
  UNIQUE (campaign_id, sequence)
);

CREATE TABLE content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  channel text NOT NULL,
  audience text,
  content text NOT NULL,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'volunteer',
  referral_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  referral_code text,
  channel text,
  user_agent text,
  ip_hash text,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  amount bigint NOT NULL,
  frequency text DEFAULT 'one_time',
  referral_code text,
  donor_email text,
  donor_name text,
  donor_phone text,
  status text DEFAULT 'pending',
  payment_provider text,
  payment_id text,
  stellar_tx_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE impact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  milestone_id uuid REFERENCES milestones(id),
  content text NOT NULL,
  evidence_urls text[],
  sent_to_donors_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_state (
  phone_number text PRIMARY KEY,
  ong_id uuid REFERENCES ongs(id),
  current_step text NOT NULL DEFAULT 'greeting',
  collected_data jsonb NOT NULL DEFAULT '{}',
  campaign_id uuid REFERENCES campaigns(id),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_clicks_campaign ON click_events(campaign_id, referral_code);
CREATE INDEX idx_donations_campaign ON donations(campaign_id, status);
