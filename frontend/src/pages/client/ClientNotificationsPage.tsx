import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { getClientNotifications } from '@/data/mock';
import { formatDateTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Clock, AlertCircle, Package } from 'lucide-react';
import { useState } from 'react';

export function ClientNotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState(getClientNotifications(user?.id ?? ''));

  const markRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true } : n)));
  };

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display mb-2">
        Notifications
      </h1>

      <div className="space-y-3">
        {notifs.map((notif, i) => {
          const isReady = notif.message.includes('pret');
          const isDepot = notif.message.includes('deposee');
          const isProgress = notif.message.includes('en cours');
          const isRetire = notif.message.includes('retiree');

          let Icon = Bell;
          let color = 'text-neutral-500';
          let bg = 'bg-neutral-500/10';
          let border = 'border-neutral-500/20';

          if (isReady) {
            Icon = CheckCircle;
            color = 'text-success-500';
            bg = 'bg-success-500/10';
            border = 'border-success-500/20';
          } else if (isDepot) {
            Icon = Package;
            color = 'text-warning-500';
            bg = 'bg-warning-500/10';
            border = 'border-warning-500/20';
          } else if (isProgress) {
            Icon = Clock;
            color = 'text-primary-500';
            bg = 'bg-primary-500/10';
            border = 'border-primary-500/20';
          } else if (isRetire) {
            Icon = CheckCircle;
            color = 'text-neutral-500';
            bg = 'bg-neutral-500/10';
            border = 'border-neutral-500/20';
          }

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard
                className={`cursor-pointer ${!notif.lue ? 'border-l-4 border-l-primary-500' : ''}`}
                onClick={() => markRead(notif.id)}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 border ${border}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed ${!notif.lue ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      {formatDateTime(notif.date_envoi)}
                    </p>
                  </div>
                  {!notif.lue && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {notifs.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Aucune notification.</p>
        </div>
      )}
    </div>
  );
}
