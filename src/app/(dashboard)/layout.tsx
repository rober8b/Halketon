import Link from 'next/link';
import { ArrowRight, LayoutDashboard, Megaphone, ShieldCheck } from 'lucide-react';
import { RefinanceLogo } from '@/components/refinance-logo';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="light-surface min-h-dvh bg-[linear-gradient(180deg,hsl(210_20%_98%)_0%,hsl(0_0%_100%)_100%)] text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/70 px-5 py-6 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white">
              <RefinanceLogo className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5 text-foreground">Dashboard ONG</p>
              <p className="text-xs text-muted-foreground">Metrica, kit y milestones</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-2">
            {[
              { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
              { href: '/dashboard/campaigns/camp_001', label: 'Comedor Esperanza', icon: Megaphone },
              { href: '/c/comedor-esperanza', label: 'Landing publica', icon: ShieldCheck },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-refinance-blue" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            La data mock se reemplaza por fetch real cuando WB03 quede disponible.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white">
                <RefinanceLogo className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-5 text-foreground">Dashboard ONG</p>
                <p className="text-xs text-muted-foreground">Metrica, kit y milestones</p>
              </div>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                Resumen
              </Link>
              <Link
                href="/c/comedor-esperanza"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-refinance-blue px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
              >
                Landing publica
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
