import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('title, cause, goal_amount, total_raised, donors_count')
    .eq('slug', slug)
    .single();

  const title = campaign?.title ?? 'Campaña solidaria';
  const cause = campaign?.cause ?? '';
  const goalAmount = campaign?.goal_amount ?? 0;
  const totalRaised = campaign?.total_raised ?? 0;
  const pct = goalAmount > 0 ? Math.min(100, Math.round((totalRaised / goalAmount) * 100)) : 0;
  const donorsCount = campaign?.donors_count ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A1628',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#4A90E2',
              borderRadius: '8px',
              padding: '6px 14px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            EN MASA SOCIAL
          </div>
        </div>

        {/* Title + cause */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ color: 'white', fontSize: '52px', fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
          <div
            style={{
              color: '#94A3B8',
              fontSize: '22px',
              lineHeight: 1.4,
              maxWidth: '900px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {cause}
          </div>
        </div>

        {/* Progress bar + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bar */}
          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#1E3A5F',
              borderRadius: '999px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: '#C0613A',
                borderRadius: '999px',
              }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#C0613A', fontSize: '36px', fontWeight: 800 }}>
                {pct}%
              </span>
              <span style={{ color: '#94A3B8', fontSize: '16px' }}>recaudado</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>
                ${totalRaised.toLocaleString('es-AR')}
              </span>
              <span style={{ color: '#94A3B8', fontSize: '16px' }}>
                de ${goalAmount.toLocaleString('es-AR')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>
                {donorsCount}
              </span>
              <span style={{ color: '#94A3B8', fontSize: '16px' }}>donantes</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
