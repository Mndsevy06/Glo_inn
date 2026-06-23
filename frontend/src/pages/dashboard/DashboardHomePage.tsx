import { GlassCard, GlassCardBody } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, Package } from 'lucide-react';
import { orders, users } from '@/data/mock';

const stats = [
  { label: 'Revenus du jour', value: '87,500 CDF', icon: DollarSign, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  { label: 'Commandes en cours', value: '12', icon: ShoppingBag, color: 'text-secondary-500', bg: 'bg-secondary-500/10', border: 'border-secondary-500/20' },
  { label: 'Nouveaux clients', value: '3', icon: Users, color: 'text-accent-500', bg: 'bg-accent-500/10', border: 'border-accent-500/20' },
  { label: 'Taux de conversion', value: '94%', icon: TrendingUp, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
];

const recentOrders = orders.slice(0, 5);

export function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Tableau de bord</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Apercu de l'activite du jour</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-5" hover={false}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center border ${stat.border}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="p-5 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Commandes recentes</h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Aujourd'hui</span>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.id.toUpperCase()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.etat === 'pret' ? 'bg-success-500/10 text-success-600 border border-success-500/20' :
                        order.etat === 'en_cours' ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20' :
                        'bg-warning-500/10 text-warning-600 border border-warning-500/20'
                      }`}>
                        {order.etat === 'pret' ? 'Pret' : order.etat === 'en_cours' ? 'En cours' : 'Depose'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {order.client.nom} · {order.lignes.length} article{order.lignes.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{order.montant_total.toLocaleString()} CDF</p>
                    <span className={`text-xs ${order.statut_paiement === 'Payee' ? 'text-success-500' : 'text-error-500'}`}>
                      {order.statut_paiement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Activity Summary */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/20 dark:border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Activite</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Commandes payees</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">2 sur 6 aujourd'hui</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Dans les delais</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Toutes les commandes sont dans les delais</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Clients actifs</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{users.filter(u => u.role === 'client').length} clients enregistres</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
