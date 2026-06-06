import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';

const querySchema = z.object({
  ong_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'ong_id requerido y debe ser UUID' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select(`
      id, slug, title, cause, goal_amount, total_raised,
      donors_count, deadline, status, og_image_url, created_at,
      milestones ( id, sequence, target_amount, description, status )
    `)
    .eq('ong_id', parsed.data.ong_id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
