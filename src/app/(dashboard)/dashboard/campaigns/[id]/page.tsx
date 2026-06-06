import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getCampaignById, listCampaignIds } from '@/lib/campaigns/queries';
import { visualFor } from '@/lib/campaigns/visuals';

type PageProps = {
  params: Promise<{ id: string }>;
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
  const ids = await listCampaignIds();
  return ids.map((id) => ({ id }));
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) notFound();

  const visual = visualFor(campaign.slug);
  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );
  const sortedPromoters = [...campaign.promoters].sort(
    (a, b) => b.total_raised - a.total_raised
  );
  const appUrl = process.env.APP_URL ?? 'http://localhost:4001';
  const publicLink = `${appUrl}/c/${campaign.slug}`;

  return (
    <div className="space-y-10 pb-20 pt-2">
      {/* Hero */}
      <div
        className={`relative h-56 overflow-hidden rounded-3xl border border-border shadow-sm sm:h-72 ${visual.bgClass}`}
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

      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Detalle de campaña
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
            {campaign.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {campaign.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/c/${campaign.slug}`}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-refinance-blue px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            Ver landing pública
            <ArrowRight className="h-4 w-4" />
          </Link>
          <CopyButton text={publicLink} label="Copiar enlace público" />
        </div>
      </section>

      {/* Main grid */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        {/* Left col: contenido */}
        <div className="space-y-6">
          {/* Milestones */}
          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="space-y-5 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Milestones</p>
                  <p className="text-sm text-muted-foreground">
                    Estado del escrow para cada hito
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
                              {m.proof_description}
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

          {/* Content assets */}
          <Card className="rounded-3xl border-border shadow-sm">
            <CardContent className="space-y-5 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Kit viral</p>
                  <p className="text-sm text-muted-foreground">
                    Piezas listas para copiar y compartir
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {campaign.content_assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {asset.channel.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">{asset.audience}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset.version ? (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border bg-card text-xs text-muted-foreground"
                          >
                            v{asset.version}
                          </Badge>
                        ) : null}
                        <CopyButton text={asset.content} label="Copiar" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {asset.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Promoters */}
          {sortedPromoters.length > 0 ? (
            <Card className="rounded-3xl border-border shadow-sm">
              <CardContent className="space-y-5 p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Promotores</p>
                    <p className="text-sm text-muted-foreground">
                      Quiénes están multiplicando la campaña
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedPromoters.map((promoter) => (
                    <div
                      key={promoter.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{promoter.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-refinance-blue">
                            ?ref={promoter.referral_code}
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
                        <div className="rounded-xl border border-border bg-card p-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Clicks
                          </p>
                          <p className="mt-0.5 font-bold text-foreground">{promoter.clicks}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Donaciones
                          </p>
                          <p className="mt-0.5 font-bold text-foreground">{promoter.donations}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Recaudado
                          </p>
                          <p className="mt-0.5 font-bold text-foreground">
                            {money.format(promoter.total_raised)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right col: sidebar */}
        <aside className="lg:sticky lg:top-6 space-y-6">
          <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
            <CardContent className="space-y-5 p-7">
              <div className="space-y-2">
                <p className="text-3xl font-bold tracking-tight text-foreground">
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

              <div className="space-y-2.5 border-t border-border pt-5 text-sm">
                <Row label="Estado" value={campaign.status === 'active' ? 'Activa' : campaign.status} />
                <Row label="Responsable" value={campaign.lead_contact} />
                <Row label="Ubicación" value={campaign.location} />
                <Row
                  label="Actualizado"
                  value={new Date(campaign.updated_at).toLocaleDateString('es-AR')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-refinance-blue/20 bg-refinance-blue/5 shadow-sm">
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-refinance-blue" />
                <p className="text-sm font-bold text-foreground">Custodia transparente</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Los fondos viven en el pool USDC sobre Stellar. Cada hito libera al validarse.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
