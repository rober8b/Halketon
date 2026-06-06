import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HandHeart,
  Megaphone,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getCampaignBySlug, listCampaignSlugs } from '@/lib/campaigns/queries';
import { visualFor } from '@/lib/campaigns/visuals';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
};

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const STATUS_PALETTE = {
  validated: {
    label: 'Validado',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completado',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  reached: {
    label: 'Monto alcanzado',
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Sparkles,
  },
  pending: {
    label: 'Pendiente',
    border: 'border-border',
    bg: 'bg-background',
    text: 'text-muted-foreground',
    icon: ShieldCheck,
  },
} as const;

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const slugs = await listCampaignSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Pick<PageProps, 'params'>) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  return {
    title: campaign?.title ?? 'Campaña de donación',
    description: campaign?.description ?? 'Landing pública de campaña.',
  };
}

export default async function CampaignLanding({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const campaign = await getCampaignBySlug(slug);

  if (!campaign) notFound();

  const appUrl = process.env.APP_URL ?? 'http://localhost:4001';
  const campaignUrl = `${appUrl}/c/${campaign.slug}${ref ? `?ref=${ref}` : ''}`;
  const donateHref = `/c/${campaign.slug}/donate${ref ? `?ref=${ref}` : ''}`;
  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );
  const visual = visualFor(campaign.slug);
  const impactEntries = Object.entries(campaign.impact_per_amount)
    .map(([amount, description]) => [Number(amount), description] as const)
    .sort(([a], [b]) => a - b);

  return (
    <div className="space-y-12 pb-20 pt-6">
      {/* Hero visual */}
      <div
        className={`relative h-72 overflow-hidden rounded-3xl border border-border shadow-sm sm:h-96 ${visual.bgClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.imageUrl}
          alt={visual.alt}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <Badge
          variant="outline"
          className="absolute left-5 top-5 rounded-full border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
        >
          {campaign.cause}
        </Badge>
      </div>

      {/* Title + 2 cols */}
      <section className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Campaña activa
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              {campaign.title}
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {campaign.description}
            </p>
          </div>

          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="space-y-5 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Hitos de impacto</p>
                  <p className="text-sm text-muted-foreground">
                    Cada hito se libera cuando se sube la evidencia
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {campaign.milestones.map((m) => {
                  const palette =
                    STATUS_PALETTE[m.status as keyof typeof STATUS_PALETTE] ??
                    STATUS_PALETTE.pending;
                  const Icon = palette.icon;
                  return (
                    <div
                      key={m.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Hito {m.sequence} · {money.format(m.target_amount)}
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {m.description}
                          </p>
                          {m.proof_description ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Evidencia: {m.proof_description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-full ${palette.border} ${palette.bg} ${palette.text}`}
                      >
                        {palette.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {impactEntries.length > 0 ? (
            <Card className="rounded-3xl border-border shadow-sm">
              <CardContent className="space-y-5 p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                    <HandHeart className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Tu aporte se traduce</p>
                    <p className="text-sm text-muted-foreground">
                      Mirá qué cubre cada monto
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {impactEntries.map(([amount, description]) => (
                    <div
                      key={amount}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="text-base font-bold text-refinance-blue">
                        {money.format(amount)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {campaign.content_assets.length > 0 ? (
            <Card className="rounded-3xl border-border shadow-sm">
              <CardContent className="space-y-5 p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Kit viral</p>
                    <p className="text-sm text-muted-foreground">
                      Copiá y compartí en tus redes
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {campaign.content_assets.slice(0, 3).map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {asset.channel.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">{asset.audience}</p>
                        </div>
                        <CopyButton text={asset.content} label="Copiar" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {asset.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar sticky */}
        <aside className="lg:sticky lg:top-6">
          <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
            <CardContent className="space-y-6 p-7">
              <div className="space-y-2">
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {money.format(campaign.total_raised)}
                </p>
                <p className="text-sm text-muted-foreground">
                  recaudados de {money.format(campaign.goal_amount)}
                </p>
                <ProgressBar value={progress} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress}% completado</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {campaign.donors_count} donantes
                  </span>
                </div>
              </div>

              <Link
                href={donateHref}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-refinance-blue text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
              >
                Donar ahora
                <ArrowRight className="h-5 w-5" />
              </Link>

              <CopyButton text={campaignUrl} label="Compartir enlace" />

              <div className="space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Cierre
                  </span>
                  <span className="font-medium text-foreground">{campaign.deadline}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <HandHeart className="h-4 w-4" />
                    Mínimo
                  </span>
                  <span className="font-medium text-foreground">
                    {money.format(campaign.min_donation)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Custodia
                  </span>
                  <span className="font-medium text-foreground">Pool USDC · Stellar</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Share2 className="mr-1 inline h-3.5 w-3.5" />
            Compartilo, sumá donantes a la causa
          </p>
        </aside>
      </section>
    </div>
  );
}
