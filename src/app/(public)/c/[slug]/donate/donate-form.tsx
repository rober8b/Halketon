'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefinanceLogo } from '@/components/refinance-logo';
import type { CampaignWithRelations } from '@/types/campaign';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const presetAmounts = [10000, 30000, 60000, 120000];

type Props = {
  campaign: CampaignWithRelations;
  refCode: string | null;
};

export function DonateForm({ campaign, refCode }: Props) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState(campaign.min_donation);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impactEntries = Object.entries(campaign.impact_per_amount)
    .map(([amount, description]) => [Number(amount), description] as const)
    .sort(([a], [b]) => a - b);

  const impactText =
    [...impactEntries].reverse().find(([amount]) => amount <= selectedAmount)?.[1] ??
    impactEntries[0]?.[1] ??
    '';

  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (selectedAmount < campaign.min_donation) {
      setError(`El monto mínimo es ${money.format(campaign.min_donation)}.`);
      return;
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      setError('Completá nombre y correo electrónico.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.id,
          amount: selectedAmount,
          frequency,
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim(),
          donor_phone: donorPhone.trim() || undefined,
          referral_code: refCode ?? undefined,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'No pudimos registrar la donación.');
      }

      const search = new URLSearchParams({ amount: String(selectedAmount), frequency });
      if (refCode) search.set('ref', refCode);
      if (donorName.trim()) search.set('name', donorName.trim());

      router.push(`/c/${campaign.slug}/thanks?${search.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la donación.');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 pb-20 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      {/* Left: form */}
      <section className="space-y-6">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
          >
            Estás donando a
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
            {campaign.title}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Elegí el monto, completá los datos y confirmá. El pago se simula en este entorno;
            el flujo on-chain depende de la configuración Stellar de la ONG.
          </p>
        </div>

        <Card className="rounded-3xl border-border shadow-sm">
          <CardContent className="space-y-6 p-7">
            <div>
              <p className="text-sm font-semibold text-foreground">Elegí el monto</p>
              <p className="text-xs text-muted-foreground">
                Mínimo: {money.format(campaign.min_donation)}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSelectedAmount(amount)}
                    className={`h-12 rounded-full text-sm font-semibold transition-colors ${
                      selectedAmount === amount
                        ? 'bg-refinance-blue text-white shadow-sm'
                        : 'border-2 border-foreground/10 bg-background text-foreground hover:border-refinance-blue/40'
                    }`}
                  >
                    {money.format(amount)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="custom-amount" className="text-xs text-muted-foreground">
                  o ingresá otro monto
                </Label>
                <Input
                  id="custom-amount"
                  inputMode="numeric"
                  value={selectedAmount}
                  onChange={(event) =>
                    setSelectedAmount(Number(event.target.value) || campaign.min_donation)
                  }
                  className="mt-1 h-12 rounded-full px-5"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Frecuencia</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { value: 'one_time' as const, label: 'Una vez' },
                  { value: 'monthly' as const, label: 'Mensual' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value)}
                    className={`h-12 rounded-full text-sm font-semibold transition-colors ${
                      frequency === option.value
                        ? 'bg-refinance-blue text-white shadow-sm'
                        : 'border-2 border-foreground/10 bg-background text-foreground hover:border-refinance-blue/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-4 border-t border-border pt-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre y apellido</Label>
                  <Input
                    id="name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="h-12 rounded-full px-5"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="h-12 rounded-full px-5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="h-12 rounded-full px-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Mensaje opcional</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Dejale una dedicatoria a la ONG o a la comunidad."
                  className="rounded-2xl px-5 py-3"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={submitting}
                className="h-14 w-full rounded-full bg-refinance-blue text-base font-semibold hover:bg-blue-500"
              >
                {submitting ? 'Registrando…' : `Confirmar ${money.format(selectedAmount)}`}
                {!submitting && <ArrowRight className="h-5 w-5" />}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Al confirmar, los fondos van al pool de la campaña y se liberan por hito.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Right: summary sticky */}
      <aside className="lg:sticky lg:top-6">
        <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white">
                <RefinanceLogo className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Donás a
                </p>
                <p className="text-sm font-bold text-foreground">{campaign.title}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {money.format(campaign.total_raised)}
              </p>
              <p className="text-xs text-muted-foreground">
                recaudados de {money.format(campaign.goal_amount)}
              </p>
              <ProgressBar value={progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress}% completado</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {campaign.donors_count}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-refinance-blue/20 bg-refinance-blue/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-refinance-blue">
                Tu aporte
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">{impactText}</p>
            </div>

            <ul className="space-y-2.5 text-sm">
              {[
                'Pool de liquidez en USDC',
                'Liberación por evidencia de hito',
                'Saldo auditable en Stellar',
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-refinance-blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {refCode ? (
              <div className="rounded-2xl border border-terracotta-300 bg-terracotta-50 p-3 text-xs text-terracotta-900">
                Llegaste por el promotor <strong>{refCode}</strong>.
              </div>
            ) : null}

            <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-refinance-blue" />
              <span>Refinance no cobra comisión.</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
