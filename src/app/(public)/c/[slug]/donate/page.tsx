'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import { ProgressBar } from '@/components/campaign/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMockCampaignBySlug } from '@/lib/mock-campaigns';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const presetAmounts = [10000, 30000, 60000, 120000];

export default function DonatePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? undefined;
  const campaign = getMockCampaignBySlug(params.slug);
  const [selectedAmount, setSelectedAmount] = useState(
    campaign ? campaign.min_donation : presetAmounts[0]
  );
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time');

  if (!campaign) {
    return null;
  }

  const impactEntries = Object.entries(campaign.impact_per_amount)
    .map(([amount, description]) => [Number(amount), description] as const)
    .sort(([left], [right]) => left - right);

  const impactText =
    [...impactEntries].reverse().find(([amount]) => amount <= selectedAmount)?.[1] ??
    impactEntries[0]?.[1] ??
    '';

  const progress = Math.min(Math.round((campaign.total_raised / campaign.goal_amount) * 100), 100);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const search = new URLSearchParams({
      amount: String(selectedAmount),
      frequency,
    });

    if (refCode) {
      search.set('ref', refCode);
    }
    if (donorName.trim()) {
      search.set('name', donorName.trim());
    }

    router.push(`/c/${campaign.slug}/thanks?${search.toString()}`);
  };

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 px-3 py-1 text-refinance-blue">
            <Sparkles className="h-3.5 w-3.5" />
            Donacion publica
          </Badge>
          <Badge variant="outline" className="rounded-full border-terracotta-300 bg-terracotta-100 px-3 py-1 text-terracotta-900">
            {campaign.cause}
          </Badge>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Sumate a {campaign.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Esta pantalla no procesa un pago real. Sirve para capturar la intencion de donacion
            y llevar al siguiente paso con una experiencia clara y concreta.
          </p>
        </div>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Elegi el monto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={selectedAmount === amount ? 'default' : 'outline'}
                  className={selectedAmount === amount ? 'bg-refinance-blue hover:bg-blue-500' : ''}
                  onClick={() => setSelectedAmount(amount)}
                >
                  {money.format(amount)}
                </Button>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-amount">Monto personalizado</Label>
              <Input
                id="custom-amount"
                inputMode="numeric"
                value={selectedAmount}
                onChange={(event) => setSelectedAmount(Number(event.target.value) || campaign.min_donation)}
                className="rounded-md"
              />
            </div>

            <div className="grid gap-2">
              <Label>Frecuencia</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'one_time', label: 'Una vez' },
                  { value: 'monthly', label: 'Mensual' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={frequency === option.value ? 'default' : 'outline'}
                    className={frequency === option.value ? 'bg-refinance-blue hover:bg-blue-500' : ''}
                    onClick={() => setFrequency(option.value as 'one_time' | 'monthly')}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre y apellido</Label>
                  <Input id="name" value={donorName} onChange={(event) => setDonorName(event.target.value)} className="rounded-md" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={donorEmail}
                    onChange={(event) => setDonorEmail(event.target.value)}
                    className="rounded-md"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={donorPhone}
                  onChange={(event) => setDonorPhone(event.target.value)}
                  className="rounded-md"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note">Mensaje opcional</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  placeholder="Dejale una dedicatoria a la ONG o a la comunidad."
                  className="rounded-md"
                />
              </div>

              <Button type="submit" className="h-11 w-full bg-refinance-blue hover:bg-blue-500">
                Confirmar donacion
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Resumen de la campaña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Recaudado</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <span className="text-sm font-medium text-foreground">{money.format(campaign.goal_amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Recaudado</span>
                <span className="text-sm font-medium text-foreground">{money.format(campaign.total_raised)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Donantes</span>
                <span className="text-sm font-medium text-foreground">{campaign.donors_count}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Codigo de referido</span>
                <span className="text-sm font-medium text-foreground">{refCode ?? 'Sin codigo'}</span>
              </div>
            </div>

            <div className="rounded-lg border border-terracotta-300 bg-terracotta-50 p-4 text-sm leading-6 text-terracotta-900">
              <p className="font-semibold">Tu aporte se traduce en impacto concreto</p>
              <p className="mt-1">{impactText}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-refinance-blue" />
              Antes de seguir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 text-sm leading-6 text-muted-foreground">
            <p>1. Elegi un monto acorde al impacto que queres cubrir.</p>
            <p>2. Completá tus datos para tener un registro claro de la donacion.</p>
            <p>3. En la siguiente pantalla vas a ver el resumen y la confirmacion.</p>
            <p>4. Cuando WB03 traiga fetch real, el mismo formulario va a seguir funcionando.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
