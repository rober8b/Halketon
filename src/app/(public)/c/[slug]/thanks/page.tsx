import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, HeartHandshake, Sparkles } from 'lucide-react';

import { CopyButton } from '@/components/campaign/copy-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockCampaignBySlug, listMockCampaigns } from '@/lib/mock-campaigns';

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
  return listMockCampaigns().map((campaign) => ({ slug: campaign.slug }));
}

export const dynamic = 'force-dynamic';

export default async function ThanksPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { amount, frequency, ref, name } = await searchParams;
  const campaign = getMockCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const parsedAmount = Number(amount);
  const amountValue = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : campaign.min_donation;
  const progress = Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100);
  const appUrl = process.env.APP_URL ?? 'http://localhost:4000';
  const shareUrl = `${appUrl}/c/${campaign.slug}${ref ? `?ref=${ref}` : ''}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-10">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-refinance-blue/10 text-refinance-blue">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <Badge variant="outline" className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue">
              <Sparkles className="h-3.5 w-3.5" />
              Confirmacion lista
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Gracias por sumarte a {campaign.title}
            </h1>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          {name?.trim() ? `${name}, ` : ''}
          tu intencion de aporte quedo preparada para continuar el flujo de la campana. Esta pantalla
          sigue siendo UI, sin pasarela real.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Monto', value: money.format(amountValue) },
            { label: 'Frecuencia', value: frequency === 'monthly' ? 'Mensual' : 'Una vez' },
            { label: 'Aporte', value: campaign.cause },
          ].map((item) => (
            <Card key={item.label} className="rounded-lg border-border shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Impacto del aporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              Con este aporte, la campana sigue avanzando sobre una meta publica y verificable.
            </p>
            <div className="rounded-lg border border-terracotta-300 bg-terracotta-50 p-4 text-sm leading-6 text-terracotta-900">
              {Object.entries(campaign.impact_per_amount)
                .map(([threshold, text]) => [Number(threshold), text] as const)
                .sort(([left], [right]) => left - right)
                .reverse()
                .find(([threshold]) => threshold <= amountValue)?.[1] ??
                'Tu aporte suma al objetivo general de la campaña.'}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/c/${campaign.slug}`}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-refinance-blue px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
              >
                Volver a la campaña
                <ArrowRight className="h-4 w-4" />
              </Link>
              <CopyButton text={shareUrl} label="Copiar enlace" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartHandshake className="h-4 w-4 text-refinance-blue" />
              Siguiente paso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Progreso publico</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-refinance-blue" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{money.format(campaign.total_raised)} recaudados</span>
                <span>{campaign.donors_count} donantes</span>
              </div>
            </div>

            <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <p>1. Compartilo con tu red usando el enlace copiable.</p>
              <p>2. Si llegaste por un promotor, el codigo queda preservado en la URL.</p>
              <p>3. El dashboard ONG va a usar la misma data mock hasta que WB03 conecte el fetch real.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
