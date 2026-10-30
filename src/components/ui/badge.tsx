import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-surface-tertiary text-txt-secondary border-border',
  success: 'bg-status-success-muted text-status-success border-status-success/20',
  warning: 'bg-status-warning-muted text-status-warning border-status-warning/20',
  error: 'bg-status-error-muted text-status-error border-status-error/20',
  info: 'bg-accent-muted text-accent border-accent/20',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
