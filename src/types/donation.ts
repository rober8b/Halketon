export type DonationStatus = 'pending' | 'confirmed' | 'failed';
export type DonationFrequency = 'one_time' | 'monthly';

export interface DonationInput {
  campaign_id: string;
  amount: number;
  frequency: DonationFrequency;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  referral_code?: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  amount: number;
  frequency: DonationFrequency;
  donor_name: string;
  donor_email: string;
  donor_phone: string | null;
  referral_code: string | null;
  status: DonationStatus;
  payment_provider: string | null;
  payment_id: string | null;
  stellar_tx_hash: string | null;
  created_at: string;
}
