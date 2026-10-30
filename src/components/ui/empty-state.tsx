import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="rounded-xl bg-surface-tertiary p-4 mb-4">
        <Icon className="h-8 w-8 text-txt-muted" />
      </div>
      <h3 className="text-lg font-medium text-txt-primary mb-1">{title}</h3>
      <p className="text-sm text-txt-secondary max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
