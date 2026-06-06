import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  HandHeart,
  LayoutDashboard,
  Sparkles,
  Users,
} from 'lucide-react';

import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { listCampaigns } from '@/lib/campaigns/queries';
import { visualFor } from '@/lib/campaigns/visuals';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat('es-AR', {
  notation: 'compact',
  maximumFractionDigits: 1,
  style: 'currency',
  currency: 'ARS',
});

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const campaigns = await listCampaigns();
  const totalGoal = campaigns.reduce((sum, c) => sum + c.goal_amount, 0);
  const totalRaised = campaigns.reduce((sum, c) => sum + c.total_raised, 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + c.donors_count, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const progress = totalGoal > 0 ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) : 0;

  const promoterRows = campaigns
    .flatMap((campaign) =>
      campaign.promoters.map((promoter) => ({
        campaign_title: campaign.title,
        ...promoter,
      }))
    )
    .sort((left, right) => right.total_raised - left.total_raised)
    .slice(0, 4);

  const stats = [
    {
      label: 'Recaudado',
      value: compactMoney.format(totalRaised),
      hint: 'en pool · genera rendimiento',
      icon: BadgeDollarSign,
    },
    {
      label: 'Meta total',
      value: compactMoney.format(totalGoal),
      hint: 'sumando todas las campañas',
      icon: HandHeart,
    },
    {
      label: 'Donantes',
      value: totalDonors.toLocaleString('es-AR'),
      hint: 'sumaron a una campaña',
      icon: Users,
    },
    {
      label: 'Activas',
      value: activeCampaigns.toString(),
      hint: 'campañas en curso',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="space-y-10 pb-20 pt-2">
      {/* Header */}
      <section className="space-y-3">
        <Badge
          variant="outline"
          className="w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tu ONG
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Dashboard de la ONG
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Métrica consolidada de recaudación, donantes y avance por campaña. Todo lo que está
          activo en tu cuenta de Refinance.
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} className="rounded-3xl border-border shadow-sm">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Campaigns + promoters */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Campañas</h2>
              <p className="text-sm text-muted-foreground">{progress}% de la meta total cubierta</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {campaigns.map((campaign) => {
              const visual = visualFor(campaign.slug);
              const campaignProgress = Math.min(
                Math.round((campaign.total_raised / campaign.goal_amount) * 100),
                100
              );
              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden rounded-3xl border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className={`relative h-32 overflow-hidden ${visual.bgClass}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visual.imageUrl}
                        alt={visual.alt}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Badge
                        variant="outline"
                        className="absolute left-3 top-3 rounded-full border-white/60 bg-white/90 text-xs font-semibold text-foreground"
                      >
                        {campaign.status === 'active' ? 'Activa' : campaign.status}
                      </Badge>
                    </div>
                    <CardContent className="space-y-3 p-5">
                      <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-refinance-blue">
                        {campaign.title}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {campaign.summary}
                      </p>

                      <div className="space-y-1.5">
                        <ProgressBar value={campaignProgress} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {money.format(campaign.total_raised)}
                          </span>
                          <span className="text-muted-foreground">
                            de {money.format(campaign.goal_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {campaign.donors_count}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-refinance-blue">
                          Ver detalle
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <Card className="h-fit rounded-3xl border-border shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Promotores destacados</h2>
              <p className="text-xs text-muted-foreground">Top 4 por monto recaudado</p>
            </div>

            <div className="space-y-3">
              {promoterRows.map((promoter) => (
                <div
                  key={`${promoter.referral_code}-${promoter.campaign_title}`}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {promoter.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {promoter.campaign_title}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-full border-border bg-card text-xs text-muted-foreground"
                    >
                      {promoter.type}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <Stat label="Clicks" value={promoter.clicks.toString()} />
                    <Stat label="Donaciones" value={promoter.donations.toString()} />
                    <Stat label="Recaudado" value={compactMoney.format(promoter.total_raised)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-refinance-blue/20 bg-refinance-blue/5 p-4 text-xs leading-5 text-foreground">
              <p className="font-semibold text-refinance-blue">Avance consolidado</p>
              <p className="mt-1 text-muted-foreground">
                {progress}% de la meta total ya cubierto.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold text-foreground">{value}</p>
    </div>
  );
}
