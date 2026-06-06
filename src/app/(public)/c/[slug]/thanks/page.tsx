import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Share2,
  Sparkles,
} from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getCampaignBySlug, listCampaignSlugs } from '@/lib/campaigns/queries';
import { visualFor } from '@/lib/campaigns/visuals';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ amount?: string; frequency?: string; ref?: string; name?: string }>;
};

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export async function generateStaticParams() {
  const slugs = await listCampaignSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamic = 'force-dynamic';

export default async function ThanksPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { amount, frequency, ref, name } = await searchParams;
  const campaign = await getCampaignBySlug(slug);

  if (!campaign) notFound();

  const parsedAmount = Number(amount);
  const amountValue =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : campaign.min_donation;
  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );
  const appUrl = process.env.APP_URL ?? 'http://localhost:4001';
  const shareUrl = `${appUrl}/c/${campaign.slug}${ref ? `?ref=${ref}` : ''}`;
  const visual = visualFor(campaign.slug);

  const impactEntries = Object.entries(campaign.impact_per_amount)
    .map(([threshold, text]) => [Number(threshold), text] as const)
    .sort(([a], [b]) => a - b);
  const impactText =
    [...impactEntries].reverse().find(([threshold]) => threshold <= amountValue)?.[1] ??
    'Tu aporte suma al objetivo general de la campaña.';

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20 pt-10">
      {/* Hero confirmación */}
      <section
        className={`relative overflow-hidden rounded-3xl border border-border p-10 text-center shadow-sm sm:p-14 ${visual.bgClass}`}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
          <CheckCircle2 className="h-10 w-10 text-refinance-blue" />
        </div>
        <Badge
          variant="outline"
          className="mx-auto mt-5 w-fit rounded-full border-white/60 bg-white/90 text-foreground shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Donación confirmada
        </Badge>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
          {name?.trim() ? `Gracias, ${name}.` : '¡Gracias por tu aporte!'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-foreground/80 sm:text-lg">
          Tu donación ya forma parte de <strong>{campaign.title}</strong>. Te mantenemos al
          tanto cuando se valide cada hito.
        </p>
      </section>

      {/* Resumen + impacto */}
      <section className="grid gap-6 lg:grid-cols-3">
        {[
          { label: 'Monto', value: money.format(amountValue) },
          {
            label: 'Frecuencia',
            value: frequency === 'monthly' ? 'Mensual' : 'Una vez',
          },
          { label: 'Causa', value: campaign.cause },
        ].map((item) => (
          <Card key={item.label} className="rounded-3xl border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Impacto + share */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-border shadow-sm">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Tu aporte se traduce en</p>
                <p className="text-sm text-muted-foreground">Impacto concreto, no abstracto</p>
              </div>
            </div>
            <div className="rounded-2xl border border-refinance-blue/20 bg-refinance-blue/5 p-5 text-base leading-7 text-foreground">
              {impactText}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progreso de la campaña</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{money.format(campaign.total_raised)} recaudados</span>
                <span>{campaign.donors_count} donantes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-sm">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Multiplicá el impacto</p>
                <p className="text-sm text-muted-foreground">
                  Compartilo con tu red en un click
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Cada vez que alguien dona desde tu enlace, sumás visibilidad y avanzás los hitos
              de la campaña.
            </p>
            <CopyButton text={shareUrl} label="Copiar enlace para compartir" />
            <Link
              href={`/c/${campaign.slug}`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-foreground/15 bg-background text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Volver a la campaña
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-refinance-blue/20 bg-[linear-gradient(135deg,hsl(210_60%_96%)_0%,hsl(214_84%_88%)_100%)] p-8 text-center sm:p-10">
        <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          ¿Conocés a una ONG que necesite una campaña?
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Pasale el dato. En 5 minutos por WhatsApp tiene la campaña lista.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-refinance-blue px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          Ver cómo funciona
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
