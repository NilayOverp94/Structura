import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-txt-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('input-field', error && 'border-status-error focus:border-status-error focus:ring-status-error', className)}
          {...props}
        />
        {error && <p className="text-xs text-status-error">{error}</p>}
        {hint && !error && <p className="text-xs text-txt-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
