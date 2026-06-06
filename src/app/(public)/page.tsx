import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Heart,
  LineChart,
  Lock,
  MessageCircleHeart,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RefinanceLogo } from '@/components/refinance-logo';
import { listCampaigns } from '@/lib/campaigns/queries';
import { visualFor } from '@/lib/campaigns/visuals';
import type { CampaignWithRelations } from '@/types/campaign';

export const metadata = {
  title: 'Refinance — Campañas de donación que viven en WhatsApp',
  description:
    'Una ONG escribe a un agente IA por WhatsApp y en 5 minutos tiene una campaña con kit viral, escrow on-chain y fondos en pool de liquidez con rendimiento.',
};

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export default async function LandingPage() {
  const campaigns = await listCampaigns();
  const featured = campaigns[0] ?? null;

  return (
    <div className="space-y-24 pb-24 pt-10">
      <HeroSection featured={featured} />
      <HowItWorksSection />
      <AgentJourneySection />
      <ChatDemoSection />
      <EscrowPoolSection />
      <StackSection />
      <FinalCtaSection />
      <FeaturedCampaignsSection campaigns={campaigns} />
      <Footer />
    </div>
  );
}

/* -------------------------------------------------- Hero -------------------------------------------------- */

function HeroSection({ featured }: { featured: CampaignWithRelations | null }) {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-7">
        <h1 className="text-5xl font-bold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
          Donar deja de ser donar a una <span className="text-refinance-blue">caja negra</span>.
        </h1>

        <p className="max-w-xl text-lg leading-7 text-muted-foreground sm:text-xl">
          La ONG le escribe a nuestro agente por WhatsApp, en 5 minutos tiene una campaña viral
          con landing pública, los fondos van a un pool de liquidez y cada hito se libera
          cuando se sube la evidencia.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={featured ? `/c/${featured.slug}` : '/dashboard'}
            className="inline-flex h-14 items-center gap-2 rounded-full bg-refinance-blue px-7 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            Donar ahora
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-foreground/15 bg-background px-7 text-base font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Lanzar una campaña
          </Link>
        </div>

        <div className="flex flex-wrap gap-5 pt-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-refinance-blue" />
            Sin equipo técnico
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-refinance-blue" />
            Sin costo de licencias
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-refinance-blue" />
            Fondos auditables on-chain
          </span>
        </div>
      </div>

      {featured ? <HeroCampaignCard campaign={featured} /> : null}
    </section>
  );
}

function HeroCampaignCard({ campaign }: { campaign: CampaignWithRelations }) {
  const visual = visualFor(campaign.slug);
  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );

  return (
    <Card className="overflow-hidden rounded-3xl border-border shadow-xl">
      <div className={`relative h-56 overflow-hidden ${visual.bgClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.imageUrl}
          alt={visual.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <Badge
          variant="outline"
          className="absolute left-4 top-4 rounded-full border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
        >
          {campaign.cause}
        </Badge>
      </div>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Campaña destacada
          </p>
          <h3 className="text-xl font-bold leading-tight text-foreground">{campaign.title}</h3>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-refinance-blue"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {money.format(campaign.total_raised)}
            </span>
            <span className="text-muted-foreground">de {money.format(campaign.goal_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% completado</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {campaign.donors_count} donantes
            </span>
          </div>
        </div>

        <Link
          href={`/c/${campaign.slug}`}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-refinance-blue text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Donar a esta campaña
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------- How it works -------------------------------------------------- */

function HowItWorksSection() {
  const steps = [
    {
      title: 'Escribís al agente por WhatsApp',
      body:
        'En 5 turnos cortos contás causa, meta, fecha y los hitos de impacto. Sin app, sin formularios.',
      icon: MessageCircleHeart,
    },
    {
      title: 'Tu campaña queda lista en minutos',
      body:
        'El agente arma título, descripción, hitos y un kit viral con piezas para WhatsApp, Instagram y Twitter.',
      icon: Sparkles,
    },
    {
      title: 'Compartís y los fondos se cuidan solos',
      body:
        'Los donantes ingresan vía landing pública. El dinero entra al pool de liquidez y se libera por hito cuando subís la evidencia.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="space-y-10">
      <div className="space-y-3 text-center">
        <Badge
          variant="outline"
          className="mx-auto w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
        >
          Cómo funciona
        </Badge>
        <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          De una idea por WhatsApp a una campaña viral.
        </h2>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
          Tres pasos. Sin equipo técnico. Sin licencias.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map(({ title, body, icon: Icon }, idx) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-refinance-blue text-white shadow-lg">
              <Icon className="h-9 w-9" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-refinance-blue">
              Paso {idx + 1}
            </p>
            <h3 className="mt-2 text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------- Featured campaigns -------------------------------------------------- */

function FeaturedCampaignsSection({ campaigns }: { campaigns: CampaignWithRelations[] }) {
  if (campaigns.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
          >
            Campañas activas
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sumate a una causa que ya está caminando.
          </h2>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-refinance-blue hover:underline"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.slice(0, 3).map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignWithRelations }) {
  const visual = visualFor(campaign.slug);
  const progress = Math.min(
    Math.round((campaign.total_raised / campaign.goal_amount) * 100),
    100
  );

  return (
    <Link href={`/c/${campaign.slug}`} className="group">
      <Card className="h-full overflow-hidden rounded-3xl border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
        <div className={`relative h-44 overflow-hidden ${visual.bgClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visual.imageUrl}
            alt={visual.alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge
            variant="outline"
            className="absolute left-3 top-3 rounded-full border-white/60 bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground"
          >
            {campaign.cause}
          </Badge>
        </div>
        <CardContent className="space-y-3 p-5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-refinance-blue">
            {campaign.title}
          </h3>

          <div className="space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-refinance-blue"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {money.format(campaign.total_raised)}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {campaign.donors_count} donantes
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-refinance-blue">
              Ver campaña
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* -------------------------------------------------- Agent journey -------------------------------------------------- */

function AgentJourneySection() {
  const hops = [
    { name: 'WhatsApp', detail: 'La ONG escribe un mensaje', icon: MessageCircleHeart },
    { name: 'Kapso', detail: 'Recibe vía Cloud API y enruta al webhook', icon: Send },
    { name: 'Hermes MCP', detail: 'Expone Supabase y Stellar como tools', icon: Sparkles },
    { name: 'Higgsfield.ai', detail: 'Modelo decide qué hacer en cada turno', icon: ShieldCheck },
  ];

  return (
    <section className="space-y-8 rounded-3xl border border-border bg-card p-8 shadow-sm lg:p-12">
      <div className="space-y-2 text-center">
        <Badge
          variant="outline"
          className="mx-auto w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
        >
          Cómo viaja un mensaje
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          De WhatsApp al modelo, ida y vuelta en segundos.
        </h2>
      </div>

      <div className="relative grid gap-4 md:grid-cols-4">
        {hops.map((hop, idx) => (
          <div key={hop.name} className="relative">
            <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-background p-5 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-refinance-blue/10 text-refinance-blue">
                <hop.icon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-base font-bold text-foreground">{hop.name}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{hop.detail}</p>
            </div>
            {idx < hops.length - 1 ? (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-refinance-blue md:block" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------- Chat demo -------------------------------------------------- */

type ChatBubble = { from: 'user' | 'agent'; text: string };

const CHAT_SCRIPT: ChatBubble[] = [
  { from: 'user', text: 'Hola, queremos lanzar una campaña.' },
  {
    from: 'agent',
    text:
      '¡Hola! Soy el asistente de *Refinance* 🌱\n\nContame: ¿cuál es el nombre de tu organización y cómo te llamás?',
  },
  { from: 'user', text: 'Comedor Esperanza, soy Mariana.' },
  {
    from: 'agent',
    text:
      'Genial, *Comedor Esperanza*. ¿Cuál es la causa que quieren apoyar? Describila en pocas líneas.',
  },
  {
    from: 'user',
    text: 'Sostener viandas semanales y ampliar la cocina del barrio.',
  },
  {
    from: 'agent',
    text:
      '✅ *Tu campaña está lista*\n\n📌 Comedor Esperanza\n🎯 $1.200.000\n📅 30/09/2026\n\n🔗 refinance.app/c/comedor-esperanza\n\n¿Confirmás para publicar?',
  },
];

function ChatDemoSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="space-y-5">
        <Badge
          variant="outline"
          className="rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
        >
          El agente en acción
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Una conversación corta y la campaña queda publicada.
        </h2>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          Para la ONG es solo WhatsApp. Por detrás, Kapso entrega los mensajes, Hermes MCP
          conecta las tools y Higgsfield.ai corre el agente.
        </p>

        <ul className="space-y-3 text-sm leading-6">
          {[
            'Sin app que descargar ni cuenta que crear.',
            'Respuestas en segundos durante la conversación.',
            'El agente recuerda tu campaña entre mensajes.',
            'Si te trabás, escribís «reiniciar» y volvés a empezar.',
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-refinance-blue" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute -top-3 right-6 z-10 rounded-full border border-terracotta-300 bg-terracotta-50 px-3 py-1 text-xs font-semibold text-terracotta-900 shadow-sm">
          Demo del flujo real
        </div>
        <div
          className="rounded-3xl border border-border bg-[#0b141a] p-5 shadow-2xl"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(74,144,226,0.10), transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.05), transparent 35%)',
          }}
        >
          <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <RefinanceLogo className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Refinance</p>
              <p className="text-xs text-white/60">en línea · responde en segundos</p>
            </div>
          </div>

          <div className="space-y-3 px-1">
            {CHAT_SCRIPT.map((bubble, idx) => (
              <ChatBubbleView key={idx} bubble={bubble} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
            <Send className="h-3.5 w-3.5" />
            Mensaje
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubbleView({ bubble }: { bubble: ChatBubble }) {
  const isAgent = bubble.from === 'agent';
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[78%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${
          isAgent
            ? 'rounded-bl-sm bg-[#202c33] text-white/90'
            : 'rounded-br-sm bg-[#005c4b] text-white'
        }`}
      >
        {bubble.text}
      </div>
    </div>
  );
}

/* -------------------------------------------------- Escrow + Pool -------------------------------------------------- */

const STATUS_PALETTE = {
  validated: {
    label: 'Validado',
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  reached: {
    label: 'Monto alcanzado',
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  pending: {
    label: 'Pendiente',
    border: 'border-border',
    bg: 'bg-background',
    text: 'text-muted-foreground',
  },
} as const;

function EscrowPoolSection() {
  const milestones = [
    { sequence: 1, amount: 250_000, title: 'Compra de alimentos secos', status: 'validated' as const },
    { sequence: 2, amount: 600_000, title: 'Cobertura de viandas 4 semanas', status: 'reached' as const },
    { sequence: 3, amount: 1_200_000, title: 'Segunda línea de cocina', status: 'pending' as const },
  ];

  return (
    <section className="space-y-10">
      <div className="space-y-3 text-center">
        <Badge
          variant="outline"
          className="mx-auto w-fit rounded-full border-refinance-blue/30 bg-refinance-blue/10 text-refinance-blue"
        >
          Escrow on-chain · pool de liquidez
        </Badge>
        <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          El dinero no duerme mientras se llena el goal.
        </h2>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
          p2p.me convierte los pesos a stablecoin, el saldo entra al pool y se libera por hito
          cuando la ONG sube la evidencia.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-3xl border-border shadow-sm">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-refinance-blue/10 text-refinance-blue">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Liberación por proof</p>
                <p className="text-sm text-muted-foreground">
                  Cada hito necesita evidencia para abrirse
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {milestones.map((m) => {
                const palette = STATUS_PALETTE[m.status];
                return (
                  <div
                    key={m.sequence}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background p-4"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Hito {m.sequence} · {money.format(m.amount)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{m.title}</p>
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

        <div className="grid gap-4">
          <PoolHighlight
            icon={Wallet}
            title="p2p.me como rampa"
            body="El donante paga en pesos, p2p.me convierte y el saldo entra al pool en USDC sobre Stellar. Sin wallet para la ONG."
          />
          <PoolHighlight
            icon={LineChart}
            title="Rendimiento en la espera"
            body="Mientras se llena el goal, el saldo en pool genera rendimiento variable. Queda asociado a la campaña."
          />
          <PoolHighlight
            icon={Coins}
            title="Auditable en Stellar"
            body="Saldo, movimientos y validaciones son verificables desde el explorer. No hay caja negra."
          />
        </div>
      </div>
    </section>
  );
}

function PoolHighlight({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wallet;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-3xl border-border shadow-sm">
      <CardContent className="space-y-2 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-refinance-blue/10 text-refinance-blue">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-base font-bold text-foreground">{title}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------- Stack -------------------------------------------------- */

function StackSection() {
  const items = [
    'Kapso',
    'Hermes MCP',
    'Higgsfield.ai',
    'p2p.me',
    'Stellar / Soroban',
    'Supabase',
    'Next.js 15',
  ];

  return (
    <section className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Armado con piezas probadas
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-base font-semibold text-muted-foreground">
        {items.map((item, idx) => (
          <span key={item} className="flex items-center gap-x-8">
            {item}
            {idx < items.length - 1 ? (
              <span className="text-muted-foreground/40">·</span>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------- Final CTA -------------------------------------------------- */

function FinalCtaSection() {
  return (
    <section className="overflow-hidden rounded-3xl border border-refinance-blue/20 bg-[linear-gradient(135deg,hsl(210_60%_96%)_0%,hsl(214_84%_88%)_100%)] p-10 shadow-sm sm:p-14">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-refinance-blue/40 bg-white/80 text-refinance-blue"
          >
            <Heart className="h-3.5 w-3.5" />
            ¿Tu ONG tiene una causa?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
            Probá el flujo entero en menos de 5 minutos.
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Mirá la campaña demo, recorré el dashboard de la ONG y entendé qué corre por detrás.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/c/comedor-esperanza"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-refinance-blue px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            Ver campaña demo
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-foreground/15 bg-white px-6 text-base font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Ver dashboard ONG
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Footer -------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border pt-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white">
              <RefinanceLogo className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Refinance</p>
              <p className="text-xs text-muted-foreground">
                Campañas de donación que viven en WhatsApp
              </p>
            </div>
          </div>
          <p className="max-w-md text-xs leading-5 text-muted-foreground">
            Hecho para Halketon Solidaria 2026. La plataforma corre sobre testnet — los pagos en
            este entorno son simulados.
          </p>
        </div>

        <FooterCol
          title="Producto"
          links={[
            { label: 'Campaña demo', href: '/c/comedor-esperanza' },
            { label: 'Dashboard ONG', href: '/dashboard' },
            { label: 'Inbox del agente', href: '/inbox' },
          ]}
        />
        <FooterCol
          title="Stack"
          links={[
            { label: 'Kapso', href: 'https://kapso.ai' },
            { label: 'Higgsfield.ai', href: 'https://higgsfield.ai' },
            { label: 'Stellar', href: 'https://stellar.org' },
          ]}
        />
        <FooterCol
          title="Más"
          links={[
            { label: 'p2p.me', href: 'https://p2p.me' },
            { label: 'Supabase', href: 'https://supabase.com' },
            { label: 'Next.js', href: 'https://nextjs.org' },
          ]}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span>© 2026 Refinance · Halketon Solidaria</span>
        <span>Argentina · español rioplatense</span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
      <ul className="space-y-1.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-refinance-blue"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
