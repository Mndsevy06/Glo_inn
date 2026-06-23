import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
}

export function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  icon,
}: GlassButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl backdrop-blur-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    size === 'sm' && 'px-4 py-2 text-sm',
    size === 'md' && 'px-5 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    variant === 'primary' && 'glass-button-primary',
    variant === 'secondary' && 'glass-button',
    variant === 'danger' && 'glass-button-danger',
    variant === 'success' && 'glass-button-success',
    variant === 'ghost' && 'bg-transparent hover:bg-white/20 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300',
    className
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
