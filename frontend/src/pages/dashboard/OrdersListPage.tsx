import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { ordersApi } from '@/lib/api';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, QrCode, CreditCard, Search, Filter, CheckCircle2, Loader2, Bell, X, History, Lock, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useOutletContext } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusConfig: Record<string, any> = {
  en_attente: { label: 'En attente (Client)', icon: Clock, color: 'text-error-500', bg: 'bg-error-500/10', border: 'border-error-500/20' },
  depose: { label: 'Depose', icon: Package, color: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
  en_cours: { label: 'En cours', icon: Clock, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  pret: { label: 'Pret', icon: CheckCircle, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
  retire: { label: 'Retire', icon: CheckCircle2, color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

export function OrdersListPage() {
  const { addToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [remindersModalData, setRemindersModalData] = useState<{ id: string; rappels: any[] } | null>(null);
  const { searchQuery } = useOutletContext<{ searchQuery: string }>() || { searchQuery: '' };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error(error);
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // 🔒 Security confirmation before marking as 'retire'
    if (newStatus === 'retire') {
      const confirmed = window.confirm(
        '⚠️ Attention !\n\nVous êtes sur le point de marquer cette commande comme "Retirée".\n\nCette action est IRRÉVERSIBLE : le statut ne pourra plus jamais être modifié.\n\nConfirmez-vous cette action ?'
      );
      if (!confirmed) return;
    }
    try {
      await ordersApi.updateStatus(id, newStatus);
      addToast('Statut mis à jour', 'success');
      fetchOrders();
    } catch (error) {
      console.error(error);
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const printInvoice = (order: any) => {
    const windowPrint = window.open('', '', 'width=300,height=600');
    if (windowPrint) {
      windowPrint.document.write(`
<html><head><title>Facture</title>
<style>body { font-family: monospace; margin: 0; padding: 10px; width: 80mm; } .text-center { text-align: center; } .text-left { text-align: left; } .flex { display: flex; } .justify-between { justify-content: space-between; } .font-bold { font-weight: bold; } .text-xl { font-size: 1.25rem; } .text-xs { font-size: 0.75rem; } .text-base { font-size: 1rem; } .text-sm { font-size: 0.875rem; } .mb-4 { margin-bottom: 1rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-1 { margin-bottom: 0.25rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-6 { margin-top: 1.5rem; } .pb-4 { padding-bottom: 1rem; } .pb-2 { padding-bottom: 0.5rem; } .pt-4 { padding-top: 1rem; } .pr-2 { padding-right: 0.5rem; } .border-b { border-bottom: 1px dashed black; } .border-t { border-top: 1px dashed black; } .uppercase { text-transform: uppercase; } .w-full { width: 100%; } .flex-1 { flex: 1; } </style>
</head><body>
  <div class="text-center mb-4 border-b pb-4">
    <h2 class="text-xl font-bold uppercase">Pressing Gloria</h2>
    <p class="text-xs mt-1">Numéro: ${order.facture?.numero || order.id.split('-')[0].toUpperCase()}</p>
    <p class="text-xs">${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}</p>
  </div>
  <div class="mb-4 text-xs">
    <p><span class="font-bold">Client:</span> ${order.client?.nom}</p>
    <p><span class="font-bold">Tel:</span> ${order.client?.telephone}</p>
  </div>
  <div class="border-b pb-2 mb-2 text-xs">
    <div class="flex justify-between font-bold mb-1">
      <span>Article</span>
      <span>Total</span>
    </div>
    ${order.lignes.map((item: any) => {
      const price = item.type_service === 'Express' && item.service.tarif_express ? Number(item.service.tarif_express) : Number(item.service.tarif_unitaire);
      return `
      <div class="flex justify-between mb-1">
        <span class="flex-1 pr-2 text-left">
          ${item.quantite}x ${item.service.libelle} ${item.type_service === 'Express' ? '(Exp)' : ''}
        </span>
        <span>${formatCurrency(price * item.quantite)}</span>
      </div>`;
    }).join('')}
  </div>
  <div class="flex justify-between font-bold text-base mt-2">
    <span>TOTAL</span>
    <span>${formatCurrency(Number(order.montant_total))}</span>
  </div>
  <div class="text-center mt-6 text-xs border-t pt-4">
    <p>Merci de votre visite !</p>
    <p>A bientôt chez Pressing Gloria</p>
  </div>
</body></html>
      `);
      windowPrint.document.close();
      windowPrint.focus();
      setTimeout(() => {
        windowPrint.print();
        windowPrint.close();
      }, 500);
    }
  };

  const handlePayment = async (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Confirmer le paiement cash de cette commande ?')) {
      try {
        await ordersApi.updatePayment(order.id);
        addToast('Paiement validé avec succès', 'success');
        fetchOrders();
        
        if (confirm('Voulez-vous imprimer la facture maintenant ?')) {
          printInvoice(order);
        }
      } catch (error) {
        console.error(error);
        addToast('Erreur lors de la validation du paiement', 'error');
      }
    }
  };

  const handleSendReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ordersApi.sendReminder(id);
      addToast('Rappel envoyé au client', 'success');
      fetchOrders();
    } catch (error) {
      console.error(error);
      addToast("Erreur lors de l'envoi du rappel", 'error');
    }
  };

  const filtered = orders.filter((o) => {
    const term = search || searchQuery || '';
    const matchesSearch = o.id.toLowerCase().includes(term.toLowerCase()) || o.client?.nom.toLowerCase().includes(term.toLowerCase());
    const matchesStatus = !statusFilter || o.etat === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: filtered.length,
    revenue: filtered.reduce((acc, o) => acc + Number(o.montant_total || 0), 0),
    paid: filtered.filter(o => o.statut_paiement === 'Payee').reduce((acc, o) => acc + Number(o.montant_total || 0), 0),
    unpaid: filtered.filter(o => o.statut_paiement !== 'Payee').reduce((acc, o) => acc + Number(o.montant_total || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Liste des Commandes</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Suivi et gestion de toutes les commandes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4" hover={false}>
          <div className="text-xs text-neutral-500 mb-1">Commandes affichées</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </GlassCard>
        <GlassCard className="p-4" hover={false}>
          <div className="text-xs text-neutral-500 mb-1">Revenus (filtrés)</div>
          <div className="text-xl font-bold text-primary-500">{formatCurrency(stats.revenue)}</div>
        </GlassCard>
        <GlassCard className="p-4" hover={false}>
          <div className="text-xs text-neutral-500 mb-1">Payé</div>
          <div className="text-xl font-bold text-success-500">{formatCurrency(stats.paid)}</div>
        </GlassCard>
        <GlassCard className="p-4" hover={false}>
          <div className="text-xs text-neutral-500 mb-1">Reste à payer</div>
          <div className="text-xl font-bold text-error-500">{formatCurrency(stats.unpaid)}</div>
        </GlassCard>
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
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="">Tous les statuts</option>
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="en_attente">En file d'attente</option>
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="depose">Depose</option>
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="en_cours">En cours</option>
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="pret">Pret</option>
            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="retire">Retire</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <GlassCard hover={false} className="overflow-hidden min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 dark:border-white/10 text-left text-xs text-neutral-500 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Paiement</th>
                <th className="px-4 py-3 font-medium">Rappels</th>
                <th className="px-4 py-3 font-medium">Dernier Rappel</th>
                <th className="px-4 py-3 font-medium text-right">Montant</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10">
              {filtered.map((order, i) => {
                const config = statusConfig[order.etat] || statusConfig['depose'];
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
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{order.id.split('-')[0].toUpperCase() || order.id.toUpperCase()}</td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{order.client?.nom}</td>
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
                    <td className="px-4 py-3">
                      {(() => {
                        const rappels = order.notifications || [];
                        const unread = rappels.filter((n: any) => !n.lue).length;
                        return (
                          <button
                            type="button"
                            className="relative p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Envoyer un rappel"
                            onClick={(e) => handleSendReminder(order.id, e)}
                          >
                            <Bell className="w-4 h-4 text-neutral-500" />
                            {unread > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {(() => {
                        const rappels = order.notifications || [];
                        if (rappels.length === 0) return '-';
                        if (rappels.length === 1) {
                          return formatDateTime(rappels[0].date_envoi);
                        }
                        return (
                          <div className="flex flex-col gap-1 items-start">
                            <span>{formatDateTime(rappels[rappels.length - 1].date_envoi)}</span>
                            <button
                              type="button"
                              className="text-primary-500 hover:text-primary-600 underline font-medium"
                              onClick={(e) => { e.stopPropagation(); setRemindersModalData({ id: order.id, rappels }); }}
                            >
                              Voir tout ({rappels.length})
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(Number(order.montant_total))}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.etat === 'retire' ? (
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                            title="Commande retirée — statut verrouillé"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span className="font-medium">Retiré</span>
                          </div>
                        ) : order.etat === 'en_attente' ? (
                          <button
                            className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-md transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'depose'); }}
                          >
                            Valider
                          </button>
                        ) : (
                          <select
                            className="glass-input py-1 px-2 text-xs w-28"
                            value={order.etat}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="depose">Depose</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="en_cours">En cours</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="pret">Pret</option>
                            <option className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" value="retire">Retire</option>
                          </select>
                        )}
                        {order.statut_paiement !== 'Payee' && (
                          <button
                            className="p-1.5 rounded-lg hover:bg-success-500/10 text-success-500"
                            title="Valider paiement cash"
                            onClick={(e) => handlePayment(order, e)}
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-500"
                          title="Imprimer la facture"
                          onClick={(e) => { e.stopPropagation(); printInvoice(order); }}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Aucune commande trouvée.</p>
          </div>
        )}
      </GlassCard>

      {/* Reminders Modal */}
      {remindersModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setRemindersModalData(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <History className="w-4 h-4 text-primary-500" />
                  Historique des rappels
                </h2>
                <button
                  type="button"
                  onClick={() => setRemindersModalData(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {remindersModalData.rappels.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${r.lue ? 'bg-neutral-50 border-neutral-100 dark:bg-white/5 dark:border-white/10' : 'bg-primary-50/50 border-primary-100 dark:bg-primary-500/10 dark:border-primary-500/20'}`}>
                    <p className={`text-sm ${r.lue ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-medium'}`}>
                      {r.message}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-neutral-400">
                        {formatDateTime(r.date_envoi)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.lue ? 'bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400' : 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400'}`}>
                        {r.lue ? 'Lu' : 'Non lu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
