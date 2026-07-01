import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  inputClassName?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, iconRight, className, inputClassName, ...props }, ref) => {
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'glass-input w-full',
              icon && 'pl-11',
              iconRight && 'pr-11',
              error && 'border-error-400/50 focus:ring-error-500/50 focus:border-error-400/50',
              inputClassName
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-error-500">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
