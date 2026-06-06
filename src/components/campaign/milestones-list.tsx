import { CheckCircle2, CircleDot, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Milestone } from '@/types/campaign';
import { cn } from '@/lib/utils';

type MilestonesListProps = {
  milestones: Milestone[];
  compact?: boolean;
};

const statusCopy: Record<Milestone['status'], string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  reached: 'Meta alcanzada',
  validated: 'Validado',
};

const statusStyles: Record<Milestone['status'], string> = {
  pending: 'border-border bg-background text-muted-foreground',
  completed: 'border-[var(--terracotta-300)] bg-[var(--terracotta-100)] text-[var(--terracotta-900)]',
  reached: 'border-[var(--terracotta-300)] bg-[var(--terracotta-100)] text-[var(--terracotta-900)]',
  validated: 'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary-hover)]',
};

export function MilestonesList({ milestones, compact = false }: MilestonesListProps) {
  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {milestones
        .slice()
        .sort((left, right) => left.sequence - right.sequence)
        .map((milestone) => (
          <article
            key={milestone.id}
            className={cn(
              'rounded-lg border bg-card p-4 shadow-sm',
              compact ? 'p-3' : 'p-4'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-background">
                {milestone.status === 'validated' ? (
                  <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                ) : milestone.status === 'reached' ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--terracotta-700)]" />
                ) : (
                  <CircleDot className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Hito {milestone.sequence}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{milestone.description}</p>
                  </div>
                  <Badge variant="outline" className={cn('rounded-full px-3 py-1', statusStyles[milestone.status])}>
                    {statusCopy[milestone.status]}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>Meta: ${milestone.target_amount.toLocaleString('es-AR')}</span>
                  {milestone.validated_at ? <span>Validado el {new Date(milestone.validated_at).toLocaleDateString('es-AR')}</span> : null}
                </div>

                {milestone.proof_description ? (
                  <p className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 text-muted-foreground">
                    {milestone.proof_description}
                  </p>
                ) : null}

                {milestone.proof_url ? (
                  <div className="mt-3">
                    <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--refinance-blue)] hover:bg-transparent hover:text-[var(--primary-hover)]">
                      <a href={milestone.proof_url} target="_blank" rel="noreferrer">
                        Ver evidencia
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
