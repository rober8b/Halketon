import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ClipboardList, Megaphone, ShieldCheck, Sparkles, Users } from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { MilestonesList } from '@/components/campaign/milestones-list';
import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockCampaignById, listMockCampaigns } from '@/lib/mock-campaigns';

type PageProps = {
  params: Promise<{ id: string }>;
};

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export async function generateStaticParams() {
  return listMockCampaigns().map((campaign) => ({ id: campaign.id }));
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = getMockCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const progress = Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100);
  const sortedPromoters = [...campaign.promoters].sort((left, right) => right.total_raised - left.total_raised);
  const appUrl = process.env.APP_URL ?? 'http://localhost:4000';
  const publicLink = `${appUrl}/c/${campaign.slug}`;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue">
            <Sparkles className="h-3.5 w-3.5" />
            Vista de campana
          </Badge>
          <Badge variant="outline" className="rounded-full border-terracotta-300 bg-terracotta-100 text-terracotta-900">
            {campaign.cause}
          </Badge>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{campaign.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{campaign.summary}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/c/${campaign.slug}`}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-refinance-blue px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
              >
                Ver landing publica
                <ArrowRight className="h-4 w-4" />
              </Link>
              <CopyButton text={publicLink} label="Copiar enlace publico" />
            </div>
          </div>

          <Card className="min-w-[280px] rounded-lg border-border shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="outline" className="rounded-full border-terracotta-300 bg-terracotta-100 text-terracotta-900">
                  {campaign.status === 'active' ? 'Activa' : campaign.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Meta</span>
                <span className="text-sm font-medium text-foreground">{money.format(campaign.goal_amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Recaudado</span>
                <span className="text-sm font-medium text-foreground">{money.format(campaign.total_raised)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Donantes</span>
                <span className="text-sm font-medium text-foreground">{campaign.donors_count}</span>
              </div>
              <div className="pt-2">
                <ProgressBar value={progress} />
                <p className="mt-2 text-sm text-muted-foreground">{progress}% completado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-4 w-4 text-refinance-blue" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MilestonesList milestones={campaign.milestones} />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-4 w-4 text-refinance-blue" />
              Kit viral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {campaign.content_assets.map((asset) => (
              <article key={asset.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{asset.channel.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{asset.audience}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-border bg-card text-muted-foreground">
                      v{asset.version}
                    </Badge>
                    <CopyButton text={asset.content} label="Copiar" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{asset.content}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-refinance-blue" />
              Promotores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {sortedPromoters.map((promoter) => (
              <article key={promoter.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{promoter.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{promoter.referral_code}</p>
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
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-refinance-blue" />
              Resumen operativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Responsable</span>
                <span className="text-sm font-medium text-foreground">{campaign.lead_contact}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Ubicacion</span>
                <span className="text-sm font-medium text-foreground">{campaign.location}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Actualizado</span>
                <span className="text-sm font-medium text-foreground">
                  {new Date(campaign.updated_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-terracotta-300 bg-terracotta-50 p-4 text-sm leading-6 text-terracotta-900">
              <p className="font-semibold">Documento vivo</p>
              <p className="mt-1">
                Esta pantalla ya esta separada de la fuente de datos. Cuando WB03 conecte el fetch,
                no deberia requerir cambios de interfaz.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
