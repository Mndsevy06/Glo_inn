import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, X, Sparkles, StickyNote, User, Printer, ShoppingCart, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { usersApi, servicesApi, ordersApi, ApiUser } from '@/lib/api';
import type { ServiceType } from '@/types';

// Adapting the type since we removed mock types and using backend structure
interface Service {
  id: string;
  libelle: string;
  description: string;
  image: string | null;
  tarif_unitaire: number;
  categorie: string;
  actif: boolean;
  express_disponible: boolean;
  tarif_express: number | null;
}

interface CartItem {
  id: string;
  service: Service;
  quantite: number;
  type: ServiceType;
  note: string;
}

export function NewOrderPage() {
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<ApiUser | null>(null);
  const [searchService, setSearchService] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [newClient, setNewClient] = useState({ nom: '', telephone: '', adresse: '', password: '123456' });
  const { searchQuery } = useOutletContext<{ searchQuery: string }>() || { searchQuery: '' };
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const handleCreatePhoneChange = (val: string) => {
    setNewClient(prev => {
      const digitsOnly = val.replace(/[^0-9]/g, '');
      const defaultPass = digitsOnly.length >= 6 ? digitsOnly.slice(-6) : '123456';
      return {
        ...prev,
        telephone: val,
        password: prev.password === '' || prev.password === '123456' || prev.password === prev.telephone.replace(/[^0-9]/g, '').slice(-6)
          ? defaultPass
          : prev.password
      };
    });
  };
  
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [createdOrderData, setCreatedOrderData] = useState<any | null>(null);

  useEffect(() => {
    // Load clients
    usersApi.getAll({ role: 'client', limit: 100 }).then((res) => {
      setUsers(res.users);
    }).catch(err => console.error("Erreur chargement clients", err));

    // Load services
    servicesApi.getAll().then((res) => {
      const formattedServices: Service[] = res.map(s => ({
        ...s,
        tarif_unitaire: Number(s.tarif_unitaire),
        tarif_express: s.tarif_express ? Number(s.tarif_express) : null
      }));
      setServices(formattedServices);
    }).catch(err => console.error("Erreur chargement services", err));
  }, []);

  const filteredClients = users.filter(
    (u) => u.nom.toLowerCase().includes(searchClient.toLowerCase()) || u.telephone.includes(searchClient)
  );

  const categories = Array.from(new Set(services.map(s => s.categorie)));

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredServices = services.filter((s) => {
    const term = searchService || searchQuery || '';
    const matchSearch = s.libelle.toLowerCase().includes(term.toLowerCase()) ||
                        s.categorie.toLowerCase().includes(term.toLowerCase());
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(s.categorie);
    return matchSearch && matchCat;
  });

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
    return sum + Number(price) * c.quantite;
  }, 0);

  const handleGenerateOrder = async () => {
    try {
      setIsSubmitting(true);

      let finalNewClient = undefined;
      if (selectedClient?.id === 'new') {
        const cleanedName = newClient.nom.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        const suffix = newClient.telephone.replace(/[^0-9]/g, '').slice(-4) || Math.random().toString(36).slice(2, 6);
        const generatedUsername = `c_${cleanedName}_${suffix}`;

        finalNewClient = {
          nom: newClient.nom,
          telephone: newClient.telephone,
          adresse: newClient.adresse,
          username: generatedUsername,
          password: newClient.password
        };
      }

      const res = await ordersApi.create({
        clientId: selectedClient?.id === 'new' ? undefined : selectedClient?.id,
        newClient: finalNewClient,
        cart: cart.map(item => ({
          serviceId: item.service.id,
          quantite: item.quantite,
          type: item.type,
          note: item.note
        }))
      });
      setCreatedOrderData(res);
      setShowInvoice(true);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndReset = () => {
    setShowInvoice(false);
    setCart([]);
    setSelectedClient(null);
    setNewClient({ nom: '', telephone: '', adresse: '', password: '123456' });
    setCreatedOrderData(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Nouvelle Commande</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Enregistrez une nouvelle commande au comptoir</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Services & Client (Occupies more space) */}
        <div className="lg:col-span-8 space-y-6">
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
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {selectedClient.id === 'new' ? 'Nouveau Client' : selectedClient.telephone}
                    </p>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="p-1 rounded-lg hover:bg-white/50" title="Retirer le client" aria-label="Retirer le client">
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="glass-input w-full pl-10 py-2 text-sm"
                />
              </div>
              <div className="relative z-20">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl glass-button text-sm font-medium transition-colors ${showFilters || selectedCategories.length > 0 ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 text-primary-600' : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10'}`}
                >
                  <Filter className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Filtres</span>
                  {selectedCategories.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center ml-1">{selectedCategories.length}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-4"
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Catégories</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                                isSelected
                                  ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                                  : 'glass-badge text-neutral-600 dark:text-neutral-400 border-white/20 hover:bg-white/50'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                        <button 
                          onClick={() => { setSelectedCategories([]); setShowFilters(false); }}
                          className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Réinitialiser
                        </button>
                        <button 
                          onClick={() => setShowFilters(false)}
                          className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                        >
                          Appliquer
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredServices.map((service) => (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(service)}
                  className="glass-card p-0 text-left hover:shadow-xl transition-all border border-white/40 dark:border-white/10 hover:border-primary-500/50 relative overflow-hidden flex flex-col h-full group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                  
                  {service.image ? (
                    <div className="h-28 w-full shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-b border-white/10 relative">
                      <img src={`${API_URL.replace('/api', '')}${service.image}`} alt={service.libelle} className="w-full h-full object-cover" loading="lazy" />
                      {service.express_disponible && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="warning" className="text-[10px] shadow-sm backdrop-blur-md bg-warning-500/90 text-white border-none">
                            <Sparkles className="w-3 h-3 mr-1" /> Express
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-28 w-full shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-b border-white/10 relative">
                      <ShoppingCart className="w-8 h-8 text-primary-300 dark:text-primary-800" />
                      {service.express_disponible && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="warning" className="text-[10px] shadow-sm">
                            <Sparkles className="w-3 h-3 mr-1" /> Express
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 flex-1 flex flex-col justify-between relative z-20">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">{service.libelle}</p>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-2">{formatCurrency(service.tarif_unitaire)}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart (Sticky Sidebar) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="sticky top-6 border-2 border-primary-500/10 shadow-xl shadow-primary-500/5" hover={false}>
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
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-error-500/10" title="Supprimer l'article" aria-label="Supprimer l'article">
                        <X className="w-4 h-4 text-error-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70" title="Diminuer la quantité" aria-label="Diminuer la quantité">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantite}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70" title="Augmenter la quantité" aria-label="Augmenter la quantité">
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
                        (item.type === 'Express' && item.service.tarif_express ? Number(item.service.tarif_express) : Number(item.service.tarif_unitaire)) * item.quantite
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 space-y-4 rounded-b-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                  <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Total a payer</span>
                  <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{formatCurrency(total)}</span>
                </div>
                <button
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    !selectedClient || isSubmitting
                      ? 'bg-neutral-400 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600'
                  }`}
                  onClick={handleGenerateOrder}
                  disabled={!selectedClient || isSubmitting}
                >
                  <Printer className="w-5 h-5" />
                  {isSubmitting ? 'Creation en cours...' : 'Generer et Imprimer'}
                </button>
                {!selectedClient && (
                  <p className="text-xs font-medium text-error-500 text-center bg-error-500/10 py-1.5 rounded-lg">Selectionnez un client pour valider</p>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Client Selection Modal */}
      <Modal isOpen={showClientModal} onClose={() => setShowClientModal(false)} title="Selectionner un client" size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
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
          <GlassInput label="Nom complet *" placeholder="Ex: Jean Dupont" value={newClient.nom} onChange={(e) => setNewClient({...newClient, nom: e.target.value})} />
          <GlassInput label="Téléphone ou Email *" placeholder="Ex: 082444555 ou client@example.com" value={newClient.telephone} onChange={(e) => handleCreatePhoneChange(e.target.value)} />
          <GlassInput label="Mot de passe *" type="text" placeholder="Saisir ou modifier le mot de passe" value={newClient.password} onChange={(e) => setNewClient({...newClient, password: e.target.value})} />
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={() => {
              if (newClient.nom && newClient.telephone && newClient.password) {
                const fakeClient = { id: 'new', nom: newClient.nom, telephone: newClient.telephone, role: 'client' as const, username: '', actif: true, createdAt: '' };
                setSelectedClient(fakeClient);
                setShowNewClient(false);
              } else {
                alert('Veuillez remplir les champs obligatoires (nom, téléphone, mot de passe).');
              }
            }}
          >
            Créer et sélectionner
          </GlassButton>
        </div>
      </Modal>

      {/* Invoice Preview */}
      <Modal isOpen={showInvoice} onClose={closeAndReset} title="Aperçu de la facture" size="md">
        <div className="flex flex-col items-center">
          {/* Ticket Container */}
          <div id="print-ticket" className="w-[80mm] max-w-full bg-white text-black p-4 font-mono text-sm shadow-md print:shadow-none print:m-0 print:p-0">
            <div className="text-center mb-4 border-b border-dashed border-black pb-4">
              <h2 className="text-xl font-bold uppercase">Pressing Gloria</h2>
              <p className="text-xs mt-1">Numéro: {createdOrderData?.facture?.numero || 'INV-...'}</p>
              <p className="text-xs">{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            
            <div className="mb-4 text-xs">
              <p><span className="font-bold">Client:</span> {selectedClient?.nom}</p>
              <p><span className="font-bold">Tel:</span> {selectedClient?.id === 'new' ? newClient.telephone : selectedClient?.telephone}</p>
              {selectedClient?.id === 'new' && createdOrderData?.commande?.client && (
                <div className="mt-2 p-2 border border-black border-dashed text-left">
                  <p className="font-bold">Nouveaux Identifiants:</p>
                  <p>User: {createdOrderData.commande.client.username}</p>
                  <p>Pass: {newClient.password}</p>
                </div>
              )}
            </div>

            <div className="border-b border-black border-dashed pb-2 mb-2 text-xs">
              <div className="flex justify-between font-bold mb-1">
                <span>Article</span>
                <span>Total</span>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between mb-1">
                  <span className="flex-1 pr-2 text-left">
                    {item.quantite}x {item.service.libelle} {item.type === 'Express' ? '(Exp)' : ''}
                  </span>
                  <span>{formatCurrency(
                    (item.type === 'Express' && item.service.tarif_express ? Number(item.service.tarif_express) : Number(item.service.tarif_unitaire)) * item.quantite
                  )}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-base mt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
            
            <div className="text-center mt-6 text-xs border-t border-dashed border-black pt-4">
              <p>Merci de votre visite !</p>
              <p>A bientôt chez Pressing Gloria</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full mt-6 print:hidden">
            <GlassButton variant="primary" className="flex-1" icon={<Printer className="w-4 h-4" />} onClick={() => {
                const printContent = document.getElementById('print-ticket');
                const windowPrint = window.open('', '', 'width=300,height=600');
                if (windowPrint && printContent) {
                  windowPrint.document.write('<html><head><title>Facture</title>');
                  windowPrint.document.write('<style>body { font-family: monospace; margin: 0; padding: 10px; width: 80mm; } .text-center { text-align: center; } .text-left { text-align: left; } .flex { display: flex; } .justify-between { justify-content: space-between; } .font-bold { font-weight: bold; } .text-xl { font-size: 1.25rem; } .text-xs { font-size: 0.75rem; } .text-base { font-size: 1rem; } .text-sm { font-size: 0.875rem; } .mb-4 { margin-bottom: 1rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-1 { margin-bottom: 0.25rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-6 { margin-top: 1.5rem; } .pb-4 { padding-bottom: 1rem; } .pb-2 { padding-bottom: 0.5rem; } .pt-4 { padding-top: 1rem; } .pr-2 { padding-right: 0.5rem; } .border-b { border-bottom: 1px solid black; } .border-t { border-top: 1px solid black; } .border-dashed { border-style: dashed; } .uppercase { text-transform: uppercase; } .w-full { width: 100%; } .flex-1 { flex: 1; } .p-2 { padding: 0.5rem; } .border { border: 1px solid black; }</style>');
                  windowPrint.document.write('</head><body>');
                  windowPrint.document.write(printContent.outerHTML);
                  windowPrint.document.write('</body></html>');
                  windowPrint.document.close();
                  windowPrint.focus();
                  windowPrint.print();
                  windowPrint.close();
                }
              }}>
              Imprimer
            </GlassButton>
            <GlassButton variant="secondary" className="flex-1" onClick={closeAndReset}>
              Fermer & Nouvelle Commande
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
