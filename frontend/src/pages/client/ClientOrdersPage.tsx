import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { getClientOrders } from '@/data/mock';
import { formatDate, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, CreditCard, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const statusConfig = {
  depose: { label: 'Depose', icon: Package, color: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
  en_cours: { label: 'En cours', icon: Clock, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  pret: { label: 'Pret', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
  retire: { label: 'Retire', icon: CheckCircle, color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

export function ClientOrdersPage() {
  const { user } = useAuth();
  const orders = getClientOrders(user?.id ?? '');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display mb-2">
        Mes Commandes
      </h1>

      <div className="space-y-3">
        {orders.map((order, i) => {
          const config = statusConfig[order.etat];
          const StatusIcon = config.icon;
          const isSelected = selectedOrder === order.id;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard
                className="overflow-hidden"
                hover={false}
                onClick={() => setSelectedOrder(isSelected ? null : order.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center border ${config.border}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {order.id.toUpperCase()}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(order.date_reception)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.statut_paiement === 'Payee' ? 'success' : 'error'}>
                        {order.statut_paiement}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {order.lignes.length} article{order.lignes.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(order.montant_total)}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
                  >
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        {order.lignes.map((ligne) => (
                          <div key={ligne.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-900 dark:text-neutral-100">{ligne.service.libelle}</span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">x{ligne.quantite}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={ligne.type_service === 'Express' ? 'warning' : 'default'}>
                                {ligne.type_service}
                              </Badge>
                              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {formatCurrency(ligne.sous_total)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Total</span>
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(order.montant_total)}
                        </span>
                      </div>
                      {order.statut_paiement === 'Non payee' && (
                        <GlassButton variant="primary" className="w-full" icon={<CreditCard className="w-4 h-4" />}>
                          Payer maintenant (CinetPay)
                        </GlassButton>
                      )}
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Aucune commande pour le moment.</p>
        </div>
      )}
    </div>
  );
}
