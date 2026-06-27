import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { clientApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, CreditCard, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

const statusConfig: Record<string, any> = {
  en_attente: { label: 'En attente', icon: Clock, color: 'text-error-500', bg: 'bg-error-500/10', border: 'border-error-500/20' },
  depose: { label: 'Depose', icon: Package, color: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
  en_cours: { label: 'En cours', icon: Clock, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  pret: { label: 'Pret', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
  retire: { label: 'Retire', icon: CheckCircle, color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

const statusSteps = [
  { key: 'en_attente', label: 'En attente', description: 'Votre commande est en attente de validation' },
  { key: 'depose', label: 'Depose', description: 'Vos vetements ont ete recus' },
  { key: 'en_cours', label: 'En cours', description: 'Nettoyage en progression' },
  { key: 'pret', label: 'Pret', description: 'Vos vetements sont prets' },
  { key: 'retire', label: 'Retire', description: 'Commande terminee' },
];

export function ClientHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, notificationsData] = await Promise.all([
          clientApi.getOrders(),
          clientApi.getNotifications()
        ]);
        setOrders(ordersData);
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching client data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Real-time: update unread count when a new notification arrives
  useEffect(() => {
    if (!socket) return;
    const handler = () => setNotifications(prev => [...prev, { lue: false }]);
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socket]);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Chargement...</div>;
  }

  const activeOrder = orders.find((o) => o.etat !== 'retire');
  const unreadCount = notifications.filter((n) => !n.lue).length;
  const unpaidOrders = orders.filter((o) => o.statut_paiement !== 'Payee');

  return (
    <div className="space-y-6 py-4">
      {/* Active Order Widget */}
      {activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Commande en cours</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{activeOrder.id.toUpperCase()}</p>
              </div>
              <Badge variant={activeOrder.etat === 'pret' ? 'success' : activeOrder.etat === 'en_cours' ? 'primary' : activeOrder.etat === 'en_attente' ? 'error' : 'warning'}>
                {statusConfig[activeOrder.etat]?.label ?? activeOrder.etat}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="relative mt-4">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex justify-between relative">
                {statusSteps.map((step, i) => {
                  const stepIndex = statusSteps.findIndex((s) => s.key === activeOrder.etat);
                  const isActive = i <= stepIndex;
                  const isCurrent = i === stepIndex;
                  const StepIcon = step.key === 'depose' ? Package : step.key === 'en_cours' ? Clock : step.key === 'pret' ? CheckCircle : CheckCircle;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isActive
                            ? isCurrent
                              ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30'
                              : 'bg-success-500 border-success-500 text-white'
                            : 'bg-white/50 dark:bg-white/5 border-neutral-300 dark:border-neutral-600 text-neutral-400'
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400' : isActive ? 'text-success-600 dark:text-success-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[80px] leading-tight">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 flex justify-end">
              <GlassButton variant="secondary" size="sm" onClick={() => navigate('/client/orders')} icon={<ChevronRight className="w-4 h-4" />}>
                Details
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Unpaid Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 text-center cursor-pointer" onClick={() => navigate('/client/orders')}>
            <div className="w-10 h-10 rounded-xl bg-error-500/10 flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5 text-error-500" />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{unpaidOrders.length}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Facture{unpaidOrders.length > 1 ? 's' : ''} impayée{unpaidOrders.length > 1 ? 's' : ''}</p>
          </GlassCard>
        </motion.div>

        {/* Total Spent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {formatCurrency(orders.filter(o => o.statut_paiement === 'Payee').reduce((acc, curr) => acc + Number(curr.montant_total), 0))}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total Dépensé</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Commandes recentes</h2>
            <button onClick={() => navigate('/client/orders')} className="text-xs text-primary-500 hover:text-primary-600">
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => {
              const config = statusConfig[order.etat] ?? statusConfig['depose'];
              const StatusIcon = config.icon;
              return (
                <div key={order.id} className="glass-panel p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 border ${config.border}`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{order.id.split('-')[0].toUpperCase()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {order.lignes?.length || 0} article{(order.lignes?.length || 0) > 1 ? 's' : ''} · {formatCurrency(Number(order.montant_total))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}


    </div>
  );
}
