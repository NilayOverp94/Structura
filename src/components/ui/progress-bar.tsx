import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showPercentage = true, size = 'md', className }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-txt-secondary">{label}</span>}
          {showPercentage && <span className="text-sm font-mono text-txt-muted">{percentage}%</span>}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-surface-tertiary overflow-hidden', size === 'sm' ? 'h-1' : 'h-2')}>
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
