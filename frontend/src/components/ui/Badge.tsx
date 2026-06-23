import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100/60 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-300/30 dark:border-neutral-700/30',
    primary: 'bg-primary-100/60 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300/30 dark:border-primary-700/30',
    success: 'bg-success-100/60 dark:bg-success-900/30 text-success-700 dark:text-success-300 border-success-300/30 dark:border-success-700/30',
    warning: 'bg-warning-100/60 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border-warning-300/30 dark:border-warning-700/30',
    error: 'bg-error-100/60 dark:bg-error-900/30 text-error-700 dark:text-error-300 border-error-300/30 dark:border-error-700/30',
    info: 'bg-secondary-100/60 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 border-secondary-300/30 dark:border-secondary-700/30',
  };

  return (
    <span className={cn('glass-badge', variants[variant], className)}>
      {children}
    </span>
  );
}
