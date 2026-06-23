import { GlassCard, GlassCardBody } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { services, users } from '@/data/mock';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, X, Sparkles, StickyNote, User, Printer, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { Service, ServiceType } from '@/types';

interface CartItem {
  id: string;
  service: Service;
  quantite: number;
  type: ServiceType;
  note: string;
}

export function NewOrderPage() {
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<typeof users[0] | null>(null);
  const [searchService, setSearchService] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [newClient, setNewClient] = useState({ nom: '', telephone: '', adresse: '' });

  const filteredClients = users.filter(
    (u) => u.role === 'client' && (u.nom.toLowerCase().includes(searchClient.toLowerCase()) || u.telephone.includes(searchClient))
  );

  const filteredServices = services.filter((s) =>
    s.libelle.toLowerCase().includes(searchService.toLowerCase()) ||
    s.categorie.toLowerCase().includes(searchService.toLowerCase())
  );

  const addToCart = (service: Service) => {
    const existing = cart.find((c) => c.service.id === service.id && c.type === 'Normal');
    if (existing) {
      setCart(cart.map((c) => c.id === existing.id ? { ...c, quantite: c.quantite + 1 } : c));
    } else {
      setCart([...cart, { id: Math.random().toString(36), service, quantite: 1, type: 'Normal', note: '' }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map((c) => c.id === id ? { ...c, quantite: Math.max(1, c.quantite + delta) } : c));
  };

  const removeItem = (id: string) => setCart(cart.filter((c) => c.id !== id));
  const toggleType = (id: string) => setCart(cart.map((c) => c.id === id ? { ...c, type: c.type === 'Normal' ? 'Express' : 'Normal' } : c));
  const updateNote = (id: string, note: string) => setCart(cart.map((c) => c.id === id ? { ...c, note } : c));

  const total = cart.reduce((sum, c) => {
    const price = c.type === 'Express' && c.service.tarif_express ? c.service.tarif_express : c.service.tarif_unitaire;
    return sum + price * c.quantite;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Nouvelle Commande</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Enregistrez une nouvelle commande au comptoir</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Services */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client Selection */}
          <GlassCard hover={false}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-neutral-500" />
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Client</h3>
              </div>
              {selectedClient ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                    {selectedClient.nom.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{selectedClient.nom}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{selectedClient.telephone}</p>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="p-1 rounded-lg hover:bg-white/50">
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un client par nom ou telephone..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      className="glass-input w-full pl-10 py-2 text-sm"
                      onFocus={() => setShowClientModal(true)}
                    />
                  </div>
                  <button onClick={() => setShowNewClient(true)} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                    + Nouveau client
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Services Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-neutral-500" />
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Services</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                className="glass-input w-full pl-10 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredServices.map((service) => (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(service)}
                  className="glass-card p-3 text-left hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-primary-500" />
                    </div>
                    {service.express_disponible && (
                      <Badge variant="warning" className="text-[10px]">
                        <Sparkles className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">{service.libelle}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatCurrency(service.tarif_unitaire)}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="space-y-4">
          <GlassCard className="sticky top-4" hover={false}>
            <div className="p-4 border-b border-white/20 dark:border-white/10">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Panier ({cart.length})
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">Aucun article dans le panier</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="glass-panel p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.service.libelle}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.service.categorie}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-error-500/10">
                        <X className="w-4 h-4 text-error-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantite}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleType(item.id)}
                        className={`text-xs px-2 py-1 rounded-lg border ${
                          item.type === 'Express'
                            ? 'bg-warning-500/10 text-warning-600 border-warning-500/20'
                            : 'bg-neutral-100/50 text-neutral-600 border-neutral-300/30 dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-700/30'
                        }`}
                      >
                        {item.type === 'Express' ? 'Express' : 'Normal'}
                      </button>
                      <div className="relative flex-1">
                        <StickyNote className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Note etat..."
                          value={item.note}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          className="glass-input w-full pl-7 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(
                        (item.type === 'Express' && item.service.tarif_express ? item.service.tarif_express : item.service.tarif_unitaire) * item.quantite
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-white/20 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Total</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => setShowInvoice(true)}
                  disabled={!selectedClient}
                >
                  Generer la commande
                </GlassButton>
                {!selectedClient && (
                  <p className="text-xs text-error-500 text-center">Selectionnez un client d'abord</p>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Client Selection Modal */}
      <Modal isOpen={showClientModal} onClose={() => setShowClientModal(false)} title="Selectionner un client" size="md">
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => { setSelectedClient(client); setShowClientModal(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                {client.nom.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{client.nom}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{client.telephone}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* New Client Modal */}
      <Modal isOpen={showNewClient} onClose={() => setShowNewClient(false)} title="Nouveau client" size="md">
        <div className="space-y-4">
          <GlassInput label="Nom complet" placeholder="Ex: Jean Dupont" value={newClient.nom} onChange={(e) => setNewClient({...newClient, nom: e.target.value})} />
          <GlassInput label="Telephone" placeholder="Ex: 0823456789" value={newClient.telephone} onChange={(e) => setNewClient({...newClient, telephone: e.target.value})} />
          <GlassInput label="Adresse" placeholder="Ex: Avenue de la Paix, 45" value={newClient.adresse} onChange={(e) => setNewClient({...newClient, adresse: e.target.value})} />
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={() => {
              if (newClient.nom && newClient.telephone) {
                const fakeClient = { ...newClient, id: 'new', role: 'client' as const, username: newClient.nom.toLowerCase().replace(/ /g, '_'), password: '123456' };
                setSelectedClient(fakeClient);
                setShowNewClient(false);
              }
            }}
          >
            Creer et selectionner
          </GlassButton>
        </div>
      </Modal>

      {/* Invoice Preview */}
      <Modal isOpen={showInvoice} onClose={() => setShowInvoice(false)} title="Apercu de la facture" size="md">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Pressing Gloria</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">INV-2026-NEW</p>
          </div>
          <div className="glass-panel p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Client:</span><span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedClient?.nom}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Telephone:</span><span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedClient?.telephone}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500 dark:text-neutral-400">Date:</span><span className="font-medium text-neutral-900 dark:text-neutral-100">{new Date().toLocaleDateString('fr-FR')}</span></div>
          </div>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{item.service.libelle} x{item.quantite} ({item.type})</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(
                  (item.type === 'Express' && item.service.tarif_express ? item.service.tarif_express : item.service.tarif_unitaire) * item.quantite
                )}</span>
              </div>
            ))}
            <div className="border-t border-white/20 dark:border-white/10 pt-2 flex justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Total</span>
              <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <GlassButton variant="primary" className="flex-1" icon={<Printer className="w-4 h-4" />}>
              Imprimer
            </GlassButton>
            <GlassButton variant="secondary" className="flex-1" onClick={() => setShowInvoice(false)}>
              Fermer
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
