import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { orders } from '@/data/mock';
import { formatDate, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, ChevronDown, QrCode, CreditCard, Search, Filter, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const statusConfig = {
  depose: { label: 'Depose', icon: Package, color: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
  en_cours: { label: 'En cours', icon: Clock, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  pret: { label: 'Pret', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
  retire: { label: 'Retire', icon: CheckCircle2, color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

export function OrdersListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.client.nom.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.etat === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Liste des Commandes</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Suivi et gestion de toutes les commandes</p>
        </div>
        <GlassButton variant="primary" icon={<QrCode className="w-4 h-4" />}>Scanner QR</GlassButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher par N° ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="glass-input py-2 text-sm pr-8"
          >
            <option value="">Tous les statuts</option>
            <option value="depose">Depose</option>
            <option value="en_cours">En cours</option>
            <option value="pret">Pret</option>
            <option value="retire">Retire</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <GlassCard hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 dark:border-white/10 text-left text-xs text-neutral-500 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Paiement</th>
                <th className="px-4 py-3 font-medium text-right">Montant</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10">
              {filtered.map((order, i) => {
                const config = statusConfig[order.etat];
                const StatusIcon = config.icon;
                const isSelected = selectedOrder === order.id;
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary-500/5' : ''}`}
                    onClick={() => setSelectedOrder(isSelected ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{order.id.toUpperCase()}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{order.client.nom}</td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDate(order.date_reception)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.statut_paiement === 'Payee' ? 'success' : 'error'}>
                        {order.statut_paiement === 'Payee' ? 'Payee' : 'Non payee'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(order.montant_total)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select className="glass-input py-1 px-2 text-xs w-28">
                          <option>Depose</option>
                          <option>En cours</option>
                          <option>Pret</option>
                          <option>Retire</option>
                        </select>
                        {order.statut_paiement === 'Non payee' && (
                          <button className="p-1.5 rounded-lg hover:bg-success-500/10 text-success-500" title="Valider paiement cash">
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Aucune commande trouvee.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
