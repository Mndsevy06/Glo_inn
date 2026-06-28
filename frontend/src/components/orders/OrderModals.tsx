import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, User, Plus, Minus, X, Check, Save } from 'lucide-react';
import { servicesApi, ordersApi } from '@/lib/api';

// ─── Order Details Modal ──────────────────────────────────────────────────────
export function OrderDetailsModal({ order, onClose }: { order: any; onClose: () => void }) {
  if (!order) return null;

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Détails Commande: ${order.id.split('-')[0].toUpperCase()}`} size="md">
      <div className="space-y-6">
        <div className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Informations Client</h4>
            <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100 font-medium">
              <User className="w-4 h-4 text-primary-500" />
              {order.client?.nom}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-6">{order.client?.telephone}</p>
          </div>
          <div className="flex-1 border-l border-neutral-200 dark:border-neutral-700 pl-4">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Informations Commande</h4>
            <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">Créée le : {formatDateTime(order.date_reception)}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Paiement : {order.statut_paiement}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Articles Commandés
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {order.lignes?.map((ligne: any) => (
              <div key={ligne.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {ligne.quantite}x {ligne.service?.libelle} 
                    {ligne.quantite_retiree > 0 && (
                      <span className="text-xs text-success-600 dark:text-success-500 font-bold ml-2 bg-success-50 dark:bg-success-500/10 px-1.5 py-0.5 rounded">
                        ({ligne.quantite_retiree}/{ligne.quantite} récupérés)
                      </span>
                    )}
                    {ligne.type_service === 'Express' && <span className="text-xs text-warning-500 ml-1">(Express)</span>}
                  </p>
                  {ligne.note_etat && <p className="text-xs text-neutral-500 mt-1">Note: {ligne.note_etat}</p>}
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(Number(ligne.sous_total))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <span className="font-semibold text-neutral-600 dark:text-neutral-400">Total :</span>
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(Number(order.montant_total))}</span>
        </div>
      </div>
    </Modal>
  );
}


// ─── Order Edit Modal ───────────────────────────────────────────────────────
export function OrderEditModal({ order, onClose, onSaved }: { order: any; onClose: () => void; onSaved: () => void }) {
  const [services, setServices] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setLoading(true);
      servicesApi.getAll().then(res => {
        setServices(res);
        // Initialize cart from order.lignes
        const initialCart = order.lignes?.map((l: any) => ({
          id: Math.random().toString(36),
          service: res.find((s: any) => s.id === l.id_service) || l.service,
          quantite: l.quantite,
          type: l.type_service,
          note: l.note_etat || ''
        })) || [];
        setCart(initialCart);
      }).finally(() => setLoading(false));
    }
  }, [order]);

  const updateQty = (id: string, delta: number) => setCart(cart.map(c => c.id === id ? { ...c, quantite: Math.max(1, c.quantite + delta) } : c));
  const removeItem = (id: string) => setCart(cart.filter(c => c.id !== id));
  const toggleType = (id: string) => setCart(cart.map(c => c.id === id ? { ...c, type: c.type === 'Normal' ? 'Express' : 'Normal' } : c));
  
  const addServiceToCart = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    if (!serviceId) return;
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    setCart([...cart, { id: Math.random().toString(36), service, quantite: 1, type: 'Normal', note: '' }]);
    e.target.value = ''; // Reset select
  };

  const total = cart.reduce((sum, c) => {
    const price = c.type === 'Express' && c.service.tarif_express ? Number(c.service.tarif_express) : Number(c.service.tarif_unitaire);
    return sum + price * c.quantite;
  }, 0);

  const handleSave = async () => {
    if (cart.length === 0) return alert('Le panier ne peut pas être vide');
    try {
      setSaving(true);
      const payload = cart.map(item => ({
        serviceId: item.service.id,
        quantite: item.quantite,
        type: item.type,
        note: item.note
      }));
      await ordersApi.updateCart(order.id, payload);
      onSaved();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Modifier Commande: ${order.id.split('-')[0].toUpperCase()}`} size="lg">
      <div className="space-y-6">
        {loading ? (
          <div className="py-10 text-center text-neutral-500">Chargement...</div>
        ) : (
          <>
            <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl flex items-center justify-between border border-primary-100 dark:border-primary-900/30">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">Ajouter un service</span>
              <select 
                className="glass-input text-sm py-2 px-3 w-64 bg-white dark:bg-neutral-800" 
                onChange={addServiceToCart} 
                defaultValue=""
                title="Sélectionner un service à ajouter"
                aria-label="Sélectionner un service à ajouter"
              >
                <option value="" disabled>-- Sélectionner --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle} ({formatCurrency(Number(s.tarif_unitaire))})</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.service.libelle}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatCurrency(item.type === 'Express' && item.service.tarif_express ? Number(item.service.tarif_express) : Number(item.service.tarif_unitaire))} l'unité</p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-error-500 hover:bg-error-500/10 p-1.5 rounded-lg"
                      title="Supprimer l'article"
                      aria-label="Supprimer l'article"
                    >
                      <X className="w-4 h-4"/>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
                      <button 
                        onClick={() => updateQty(item.id, -1)} 
                        className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"
                        title="Diminuer la quantité"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3 h-3"/>
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantite}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)} 
                        className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"
                        title="Augmenter la quantité"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3 h-3"/>
                      </button>
                    </div>
                    <button
                        onClick={() => toggleType(item.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${item.type === 'Express' ? 'bg-warning-500/10 text-warning-600 border-warning-500/20' : 'bg-neutral-100/50 text-neutral-600 border-neutral-300/30'}`}
                      >
                        {item.type === 'Express' ? 'Express' : 'Normal'}
                    </button>
                    <div className="text-right flex-1 text-sm font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency((item.type === 'Express' && item.service.tarif_express ? Number(item.service.tarif_express) : Number(item.service.tarif_unitaire)) * item.quantite)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="font-semibold text-neutral-600 dark:text-neutral-400">Nouveau Total :</span>
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
            </div>

            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Annuler</GlassButton>
              <GlassButton variant="primary" className="flex-1" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </GlassButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Partial Withdraw Modal ──────────────────────────────────────────────────
export function PartialWithdrawModal({ order, onClose, onSaved }: { order: any; onClose: () => void; onSaved: () => void }) {
  const [withdraws, setWithdraws] = useState<{ ligneId: string; qty: number; max: number }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      const initial = order.lignes?.map((l: any) => ({
        ligneId: l.id,
        qty: 0,
        max: l.quantite - (l.quantite_retiree || 0)
      })) || [];
      setWithdraws(initial);
    }
  }, [order]);

  const updateQty = (ligneId: string, delta: number) => {
    setWithdraws(prev => prev.map(w => {
      if (w.ligneId === ligneId) {
        const newQty = Math.max(0, Math.min(w.max, w.qty + delta));
        return { ...w, qty: newQty };
      }
      return w;
    }));
  };

  const handleSave = async () => {
    const toWithdraw = withdraws.filter(w => w.qty > 0);
    if (toWithdraw.length === 0) {
      alert('Veuillez sélectionner au moins un article à retirer.');
      return;
    }

    try {
      setSaving(true);
      await ordersApi.partialWithdraw(order.id, toWithdraw);
      onSaved();
    } catch (error) {
      console.error(error);
      alert('Erreur lors du retrait partiel.');
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  const totalToWithdraw = withdraws.reduce((acc, w) => acc + w.qty, 0);

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Récupération Partielle: ${order.id.split('-')[0].toUpperCase()}`} size="md">
      <div className="space-y-6">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Indiquez le nombre d'articles que le client récupère <strong className="text-neutral-900 dark:text-neutral-100">maintenant</strong>.
        </p>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {order.lignes?.map((ligne: any) => {
            const withdrawState = withdraws.find(w => w.ligneId === ligne.id);
            if (!withdrawState || withdrawState.max === 0) {
              return (
                <div key={ligne.id} className="p-3 rounded-xl bg-success-50 dark:bg-success-500/5 border border-success-200 dark:border-success-500/20 flex justify-between items-center opacity-70">
                  <span className="text-sm font-medium text-success-700 dark:text-success-400">{ligne.service?.libelle}</span>
                  <span className="text-xs font-bold text-success-600 dark:text-success-500">Déjà tout récupéré ({ligne.quantite}/{ligne.quantite})</span>
                </div>
              );
            }

            return (
              <div key={ligne.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{ligne.service?.libelle}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Déjà récupéré: <span className="font-bold">{ligne.quantite_retiree || 0}</span> / {ligne.quantite}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
                    <button 
                      onClick={() => updateQty(ligne.id, -1)} 
                      className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"
                      title="Diminuer"
                      aria-label="Diminuer"
                    >
                      <Minus className="w-3 h-3"/>
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-primary-600 dark:text-primary-400">{withdrawState.qty}</span>
                    <button 
                      onClick={() => updateQty(ligne.id, 1)} 
                      className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"
                      title="Augmenter"
                      aria-label="Augmenter"
                    >
                      <Plus className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <GlassButton variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Annuler</GlassButton>
          <GlassButton variant="primary" className="flex-1" icon={<Check className="w-4 h-4" />} onClick={handleSave} disabled={saving || totalToWithdraw === 0}>
            {saving ? 'Enregistrement...' : `Valider retrait (${totalToWithdraw})`}
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
}
