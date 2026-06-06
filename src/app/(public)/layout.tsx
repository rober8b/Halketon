import Link from 'next/link';
import { ArrowRight, LayoutDashboard, MessageCircleHeart } from 'lucide-react';
import { RefinanceLogo } from '@/components/refinance-logo';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="light-surface min-h-dvh bg-[linear-gradient(180deg,hsl(210_20%_98%)_0%,hsl(0_0%_100%)_100%)] text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white">
              <RefinanceLogo className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold leading-5 text-foreground">Refinance</p>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard ONG
            </Link>
            <Link
              href="/inbox"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
            >
              <MessageCircleHeart className="h-4 w-4" />
              Inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
