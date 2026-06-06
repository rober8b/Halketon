import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDonationsByCampaign } from '@/lib/donations/processor';

const querySchema = z.object({
  campaign_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'campaign_id requerido y debe ser UUID' }, { status: 400 });
  }

  try {
    const donations = await getDonationsByCampaign(parsed.data.campaign_id);
    return NextResponse.json(donations);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener donaciones';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
