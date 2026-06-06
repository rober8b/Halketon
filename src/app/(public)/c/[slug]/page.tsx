import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  HandHeart,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { MilestonesList } from '@/components/campaign/milestones-list';
import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockCampaignBySlug, listMockCampaigns } from '@/lib/mock-campaigns';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
};

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export async function generateStaticParams() {
  return listMockCampaigns().map((campaign) => ({ slug: campaign.slug }));
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>) {
  const { slug } = await params;
  const campaign = getMockCampaignBySlug(slug);

  return {
    title: campaign?.title ?? 'Campana de donacion',
    description: campaign?.description ?? 'Landing publica de campana.',
    openGraph: {
      title: campaign?.title,
      description: campaign?.description,
      images: campaign?.og_image_url ? [campaign.og_image_url] : [],
    },
  };
}

export default async function CampaignLanding({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const campaign = getMockCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:4000';
  const campaignUrl = `${appUrl}/c/${campaign.slug}${ref ? `?ref=${ref}` : ''}`;
  const donateHref = `/c/${campaign.slug}/donate${ref ? `?ref=${ref}` : ''}`;
  const progress = Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100);

  const impactEntries = Object.entries(campaign.impact_per_amount)
    .map(([amount, description]) => [Number(amount), description] as const)
    .sort(([left], [right]) => left - right);

  return (
    <div className="space-y-10 py-8">
      {campaign.cover_image_url ? (
        <section className="overflow-hidden rounded-2xl border border-border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.cover_image_url}
            alt={campaign.title}
            className="h-56 w-full object-cover sm:h-72 lg:h-80"
          />
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 px-3 py-1 text-refinance-blue">
              <Sparkles className="h-3.5 w-3.5" />
              Campana publica
            </Badge>
            <Badge variant="outline" className="rounded-full border-terracotta-300 bg-terracotta-100 px-3 py-1 text-terracotta-900">
              {campaign.cause}
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              {campaign.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {campaign.description}
            </p>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {campaign.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={donateHref}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-refinance-blue px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
            >
              <HandHeart className="h-4 w-4" />
              Donar ahora
            </Link>
            <CopyButton text={campaignUrl} label="Copiar enlace" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Recaudado', value: money.format(campaign.total_raised), icon: Banknote },
              { label: 'Donantes', value: campaign.donors_count.toLocaleString('es-AR'), icon: Users },
              { label: 'Cierre', value: campaign.deadline, icon: CalendarDays },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="rounded-lg border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-refinance-blue/10 text-refinance-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Estado de la recaudacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {money.format(campaign.goal_amount)}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-terracotta-300 bg-terracotta-100 text-terracotta-900">
                  {progress}% completado
                </Badge>
              </div>
              <div className="mt-4">
                <ProgressBar value={progress} />
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{money.format(campaign.total_raised)} recaudados</span>
                  <span>Minimo: {money.format(campaign.min_donation)}</span>
                </div>
              </div>
            </div>

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

            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Impacto por aporte</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {impactEntries.map(([amount, description]) => (
                  <div key={amount} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-semibold text-refinance-blue">{money.format(amount)}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-refinance-blue" />
              Hitos de impacto
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
              Kit viral listo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {campaign.content_assets.map((asset) => (
              <article key={asset.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {asset.channel.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{asset.audience}</p>
                  </div>
                  <CopyButton text={asset.content} label="Copiar texto" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{asset.content}</p>
              </article>
            ))}

            <div className="rounded-lg border border-terracotta-300 bg-terracotta-50 p-4 text-sm leading-6 text-terracotta-900">
              <p className="font-semibold">Difusion con seguimiento</p>
              <p className="mt-1">
                El enlace publico conserva el flujo de referidos cuando llegue la implementacion real de WB03.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm font-medium text-foreground">Listo para donar?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            La donacion sigue en una pantalla dedicada, sin pasarela real.
          </p>
        </div>
        <Link
          href={donateHref}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-refinance-blue px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          Ir al formulario
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
