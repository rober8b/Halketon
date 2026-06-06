import Link from 'next/link';
import { ArrowRight, BadgeDollarSign, HandHeart, LayoutDashboard, Users } from 'lucide-react';

import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listMockCampaigns } from '@/lib/mock-campaigns';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export default function DashboardOverviewPage() {
  const campaigns = listMockCampaigns();
  const totalGoal = campaigns.reduce((sum, campaign) => sum + campaign.goal_amount, 0);
  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.total_raised, 0);
  const totalDonors = campaigns.reduce((sum, campaign) => sum + campaign.donors_count, 0);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;
  const progress = Math.min(Math.round((totalRaised / totalGoal) * 100), 100);
  const promoterRows = campaigns
    .flatMap((campaign) =>
      campaign.promoters.map((promoter) => ({
        campaign_title: campaign.title,
        ...promoter,
      }))
    )
    .sort((left, right) => right.total_raised - left.total_raised)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Vista interna
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Dashboard de la ONG</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Metrica consolidada de recaudacion, donantes y avance por campaña. La estructura ya
          esta lista para conectar fetch real sin rehacer el layout.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Recaudado total', value: money.format(totalRaised), icon: BadgeDollarSign },
          { label: 'Meta total', value: money.format(totalGoal), icon: HandHeart },
          { label: 'Donantes', value: totalDonors.toLocaleString('es-AR'), icon: Users },
          { label: 'Campanas activas', value: activeCampaigns.toString(), icon: LayoutDashboard },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-lg border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-refinance-blue/10 text-refinance-blue">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Campanas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-5">
              {campaigns.map((campaign) => {
                const campaignProgress = Math.min(
                  Math.round((campaign.total_raised / campaign.goal_amount) * 100),
                  100
                );

                return (
                  <article key={campaign.id} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-foreground">{campaign.title}</h2>
                          <Badge
                            variant="outline"
                            className="rounded-full border-terracotta-300 bg-terracotta-100 px-2.5 py-0.5 text-terracotta-900"
                          >
                            {campaign.status === 'active' ? 'Activa' : campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{campaign.summary}</p>
                      </div>

                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                      >
                        Abrir
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>
                          {money.format(campaign.total_raised)} de {money.format(campaign.goal_amount)}
                        </span>
                        <span>{campaignProgress}%</span>
                      </div>
                      <ProgressBar value={campaignProgress} />
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>{campaign.donors_count} donantes</span>
                        <span>Cierre: {campaign.deadline}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Promotores destacados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {promoterRows.map((promoter) => (
              <article key={`${promoter.referral_code}-${promoter.campaign_title}`} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{promoter.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{promoter.campaign_title}</p>
                    <p className="mt-2 text-xs font-mono text-refinance-blue">?ref={promoter.referral_code}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-border bg-card text-muted-foreground">
                    {promoter.type}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-md border border-border bg-card p-2">
                    <p className="text-xs text-muted-foreground">Clicks</p>
                    <p className="mt-1 font-semibold text-foreground">{promoter.clicks}</p>
                  </div>
                  <div className="rounded-md border border-border bg-card p-2">
                    <p className="text-xs text-muted-foreground">Donaciones</p>
                    <p className="mt-1 font-semibold text-foreground">{promoter.donations}</p>
                  </div>
                  <div className="rounded-md border border-border bg-card p-2">
                    <p className="text-xs text-muted-foreground">Recaudado</p>
                    <p className="mt-1 font-semibold text-foreground">{money.format(promoter.total_raised)}</p>
                  </div>
                </div>
              </article>
            ))}

            <div className="rounded-lg border border-terracotta-300 bg-terracotta-50 p-4 text-sm leading-6 text-terracotta-900">
              <p className="font-semibold">Avance consolidado</p>
              <p className="mt-1">{progress}% de la meta total ya esta cubierto por las campañas mock.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
