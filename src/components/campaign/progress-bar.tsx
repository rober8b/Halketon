import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(value, 100));

  return (
    <div
      className={cn('h-3 overflow-hidden rounded-full bg-muted', className)}
      aria-label={`Progreso ${normalized}%`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
    >
      <div className="h-full rounded-full bg-[var(--refinance-blue)]" style={{ width: `${normalized}%` }} />
    </div>
  );
}
