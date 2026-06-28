import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { clientApi, paymentsApi, avisApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Clock, CheckCircle, CreditCard, ChevronRight,
  Smartphone, X, Loader2, CheckCircle2, AlertCircle, Wifi, Star, MessageSquare
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

const statusConfig: Record<string, any> = {
  en_attente: { label: 'En attente de validation', icon: Clock, color: 'text-error-500', bg: 'bg-error-500/10', border: 'border-error-500/20' },
  depose:  { label: 'Deposé',   icon: Package,      color: 'text-warning-500', bg: 'bg-warning-500/10',  border: 'border-warning-500/20' },
  en_cours:{ label: 'En cours', icon: Clock,        color: 'text-primary-500', bg: 'bg-primary-500/10',  border: 'border-primary-500/20' },
  pret:    { label: 'Prêt',     icon: CheckCircle,  color: 'text-success-500', bg: 'bg-success-500/10',  border: 'border-success-500/20' },
  retire:  { label: 'Retiré',   icon: CheckCircle,  color: 'text-neutral-500', bg: 'bg-neutral-500/10',  border: 'border-neutral-500/20' },
};

const operateurLabels: Record<string, { label: string; color: string; bg: string }> = {
  AIRTEL: { label: 'Airtel Money', color: 'text-red-600 dark:text-red-500', bg: 'bg-red-500' },
  ORANGE: { label: 'Orange Money', color: 'text-orange-600 dark:text-orange-500', bg: 'bg-orange-500' },
  MPESA:  { label: 'M-Pesa',       color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-600' },
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [step, setStep] = useState<'form' | 'pending' | 'success' | 'error'>('form');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const facture = order.facture;

  // Poll status every 5 seconds when pending
  useEffect(() => {
    if (step !== 'pending') return;
    if (!requestId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await paymentsApi.checkNetikashStatus(requestId);
        const liveStatus = (res?.netikash_live?.status || res?.paiement?.netikash_status)?.toLowerCase();
        
        if (['approved', 'completed', 'success', 'successful'].includes(liveStatus)) {
          clearInterval(pollRef.current!);
          setStep('success');
          addToast('✅ Paiement confirmé !', 'success');
          onSuccess();
        } else if (['failed', 'canceled', 'expired', 'error'].includes(liveStatus)) {
          clearInterval(pollRef.current!);
          setErrorMsg('Le paiement a échoué ou a été annulé. Veuillez réessayer.');
          setStep('error');
        }
      } catch {
        // silently ignore poll errors
      }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, requestId]);

  // Also listen for WebSocket confirmation (faster than polling)
  useEffect(() => {
    if (!socket || step !== 'pending') return;
    const handler = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStep('success');
      addToast('✅ Paiement confirmé en temps réel !', 'success');
      onSuccess();
    };
    socket.on('payment_confirmed', handler);
    return () => {
      socket.off('payment_confirmed', handler);
    };
  }, [socket, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facture?.id) {
      setErrorMsg('Aucune facture associée à cette commande.');
      setStep('error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await paymentsApi.initiateNetikash({ id_facture: facture.id });
      setRequestId(res.requestId);
      
      // Redirection vers Netikash
      window.open(res.link, '_blank');
      setStep('pending');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'initiation du paiement.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          {/* Header */}
          <div className="p-5 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Paiement Mobile Money</h2>
                <p className="text-xs text-neutral-500">Commande #{order.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 transition-colors"
              title="Fermer"
              aria-label="Fermer le modal de paiement"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            {/* ── STEP: FORM ── */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount summary */}
                <div className="glass-panel p-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Montant à payer</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(Number(order.montant_total))}
                  </span>
                </div>

                {/* Netikash only has one method, no need for choice buttons or phone inputs */}

                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Initiation en cours...' : `Payer ${formatCurrency(Number(order.montant_total))}`}
                </GlassButton>

                <p className="text-xs text-center text-neutral-400">
                  Sécurisé par <span className="font-bold text-neutral-600 dark:text-neutral-300">Netikash</span>
                </p>
              </form>
            )}

            {/* ── STEP: PENDING ── */}
            {step === 'pending' && (
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 rounded-full bg-primary-500/10 border-4 border-primary-500/20 flex items-center justify-center mx-auto">
                  <Wifi className="w-9 h-9 text-primary-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                    En attente de confirmation
                  </h3>
                  <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                    Complétez le paiement sur la page web sécurisée Netikash qui vient de s'ouvrir.
                  </p>
                </div>
                <div className="glass-panel p-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Instructions :</p>
                  <ol className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 list-decimal list-inside">
                    <li>Payez sur la fenêtre Netikash</li>
                    <li>La page se mettra à jour automatiquement une fois le paiement validé</li>
                  </ol>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Vérification automatique en cours…</span>
                </div>
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-success-500/10 border-4 border-success-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-success-500" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Paiement réussi !</h3>
                <p className="text-sm text-neutral-500">
                  Votre paiement de <strong>{formatCurrency(Number(order.montant_total))}</strong> a été confirmé.
                </p>
                <GlassButton variant="primary" className="w-full" onClick={onClose}>
                  Fermer
                </GlassButton>
              </div>
            )}

            {/* ── STEP: ERROR ── */}
            {step === 'error' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-error-500/10 border-4 border-error-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-error-500" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Paiement échoué</h3>
                <p className="text-sm text-neutral-500">{errorMsg}</p>
                <div className="flex gap-3">
                  <GlassButton variant="secondary" className="flex-1" onClick={onClose}>Annuler</GlassButton>
                  <GlassButton variant="primary" className="flex-1" onClick={() => setStep('form')}>Réessayer</GlassButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Avis Modal ──────────────────────────────────────────────────────────────
function AvisModal({ order, onClose }: { order: any; onClose: () => void }) {
  const { addToast } = useToast();
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (note === 0) { addToast('Veuillez choisir une note.', 'warning'); return; }
    setSubmitting(true);
    try {
      await avisApi.submit({ id_commande: order.id, note, commentaire });
      setDone(true);
      addToast('✅ Merci pour votre avis !', 'success');
    } catch (err: any) {
      addToast(err.message || 'Erreur lors de l\'envoi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-5 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Laisser un avis</h2>
                <p className="text-xs text-neutral-500">Commande #{order.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 transition-colors" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {done ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-success-500/10 border-4 border-success-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success-500" />
                </div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">Merci pour votre retour !</p>
                <GlassButton variant="primary" className="w-full" onClick={onClose}>Fermer</GlassButton>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Quelle note donnez-vous à cette commande ?</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setNote(s)}
                        className="transition-transform hover:scale-125"
                        aria-label={`Note ${s}`}
                      >
                        <Star className={`w-9 h-9 transition-colors ${
                          s <= (hovered || note)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-300 dark:text-neutral-600'
                        }`} />
                      </button>
                    ))}
                  </div>
                  {note > 0 && (
                    <p className="text-xs text-neutral-500 mt-2">
                      {['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent !'][note]}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Commentaire (optionnel)</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={3}
                    placeholder="Partagez votre expérience..."
                    className="w-full glass-input px-3 py-2 text-sm resize-none rounded-xl"
                  />
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full"
                  icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
                </GlassButton>
              </>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ClientOrdersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<any | null>(null);
  const [avisOrder, setAvisOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await clientApi.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
        Mes Commandes
      </h1>

      <div className="space-y-3">
        {orders.map((order, i) => {
          const config = statusConfig[order.etat] || statusConfig['depose'];
          const StatusIcon = config.icon;
          const isSelected = selectedOrder === order.id;
          const isPaid = order.statut_paiement === 'Payee';

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
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
                          #{order.id.split('-')[0].toUpperCase()}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(order.date_reception)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isPaid ? 'success' : 'error'}>
                        {isPaid ? 'Payée' : 'Non payée'}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {order.lignes?.length || 0} article{(order.lignes?.length || 0) > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(Number(order.montant_total))}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5"
                    >
                      <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Order lines */}
                        <div className="space-y-2">
                          {order.lignes?.map((ligne: any) => (
                            <div key={ligne.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-900 dark:text-neutral-100">{ligne.service?.libelle}</span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">×{ligne.quantite}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={ligne.type_service === 'Express' ? 'warning' : 'default'}>
                                  {ligne.type_service}
                                </Badge>
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {formatCurrency(Number(ligne.sous_total))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Total</span>
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(Number(order.montant_total))}
                          </span>
                        </div>

                        {/* Pay button */}
                        {!isPaid && (
                          <GlassButton
                            variant="primary"
                            className="w-full"
                            icon={<Smartphone className="w-4 h-4" />}
                            onClick={() => setPayingOrder(order)}
                          >
                            Payer par Mobile Money
                          </GlassButton>
                        )}

                        {isPaid && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 py-2 text-success-600 dark:text-success-400">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Facture entièrement payée</span>
                            </div>
                            {!order.avis ? (
                              <GlassButton
                                variant="secondary"
                                className="w-full"
                                icon={<Star className="w-4 h-4 text-amber-400" />}
                                onClick={() => setAvisOrder(order)}
                              >
                                Laisser un avis
                              </GlassButton>
                            ) : (
                              <div className="flex items-center justify-center gap-2 py-1 text-amber-500">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-xs font-medium">Avis déjà soumis — Merci !</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {/* Payment Modal */}
      <AnimatePresence>
        {payingOrder && (
          <PaymentModal
            order={payingOrder}
            onClose={() => setPayingOrder(null)}
            onSuccess={() => {
              setPayingOrder(null);
              fetchOrders();
            }}
          />
        )}
      </AnimatePresence>

      {/* Avis Modal */}
      <AnimatePresence>
        {avisOrder && (
          <AvisModal
            order={avisOrder}
            onClose={() => { setAvisOrder(null); fetchOrders(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
