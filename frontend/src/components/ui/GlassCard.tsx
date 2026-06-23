import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  strong?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function GlassCard({ children, className, hover = true, strong = false, onClick, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        strong ? 'glass-card-strong' : 'glass-card',
        'overflow-hidden',
        hover && 'cursor-pointer hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function GlassCardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-white/20 dark:border-white/10', className)}>
      {children}
    </div>
  );
}

export function GlassCardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function GlassCardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5', className)}>
      {children}
    </div>
  );
}
