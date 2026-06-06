import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import type { CampaignPublic } from '@/types/campaign';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select(`
      id, slug, title, cause, description,
      goal_amount, total_raised, donors_count, min_donation,
      deadline, status, impact_per_amount, og_image_url,
      milestones (
        id, sequence, target_amount, description,
        status, proof_url, proof_description, validated_at
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  }

  const campaign: CampaignPublic = {
    ...data,
    milestones: (data.milestones ?? []).sort(
      (a: { sequence: number }, b: { sequence: number }) => a.sequence - b.sequence
    ),
  };

  return NextResponse.json(campaign, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
