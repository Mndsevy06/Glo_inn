import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, X, Sparkles, StickyNote, ShoppingCart, Filter, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesApi, ordersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ServiceType } from '@/types';

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

export function ClientNewOrderPage() {
  const [searchService, setSearchService] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    servicesApi.getAll().then((res) => {
      const formattedServices: Service[] = res.map(s => ({
        ...s,
        tarif_unitaire: Number(s.tarif_unitaire),
        tarif_express: s.tarif_express ? Number(s.tarif_express) : null
      }));
      setServices(formattedServices.filter(s => s.actif));
    }).catch(err => console.error("Erreur chargement services", err));
  }, []);

  const categories = Array.from(new Set(services.map(s => s.categorie)));

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredServices = services.filter((s) => {
    const term = searchService || '';
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
      addToast(`${service.libelle} ajouté au panier`, 'success');
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
    if (!user) {
      addToast("Vous devez être connecté.", "error");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await ordersApi.create({
        clientId: user.id, // client logs in, so user.id is available
        cart: cart.map(item => ({
          serviceId: item.service.id,
          quantite: item.quantite,
          type: item.type,
          note: item.note
        }))
      });
      setOrderSuccess(true);
    } catch (error) {
      console.error(error);
      addToast('Erreur lors de la création de la commande', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-success-500/20 text-success-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Commande envoyée !</h2>
        <p className="text-neutral-500 mb-8 text-center max-w-md">
          Votre commande a été reçue avec succès. Vous pouvez la suivre dans la section "Commandes".
        </p>
        <GlassButton variant="primary" onClick={() => navigate('/client/orders')}>
          Voir mes commandes
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Commander</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Choisissez les services dont vous avez besoin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-col-reverse lg:flex-row">
        
        {/* Right: Cart (Sticky Sidebar) shown first on mobile if it has items? No, better keep order: Services then Cart, but in mobile we might want cart at bottom or top. Let's put cart at top on mobile if not empty, otherwise bottom */}
        <div className={`lg:col-span-5 h-full relative ${cart.length > 0 ? 'order-first lg:order-last' : 'order-last lg:order-last'}`}>
          <div className="sticky top-24 space-y-4">
            <GlassCard className="border-2 border-primary-500/10 shadow-xl shadow-primary-500/5" hover={false}>
              <div className="p-4 border-b border-white/20 dark:border-white/10">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Votre Panier ({cart.length})
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">Votre panier est vide</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="glass-panel p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.service.libelle}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-error-500/10" title="Supprimer l'article" aria-label="Supprimer l'article">
                          <X className="w-4 h-4 text-error-500" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70" title="Diminuer la quantité" aria-label="Diminuer la quantité">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantite}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white/70" title="Augmenter la quantité" aria-label="Augmenter la quantité">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
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
                    <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Total</span>
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{formatCurrency(total)}</span>
                  </div>
                  <button
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      isSubmitting
                        ? 'bg-neutral-400 cursor-not-allowed opacity-70'
                        : 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600'
                    }`}
                    onClick={handleGenerateOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Validation...' : 'Valider la commande'}
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Left: Services Grid */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
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
                  <span className="hidden sm:inline">Catégories</span>
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
                    <div className="h-24 w-full shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-b border-white/10 relative">
                      <img src={service.image.startsWith('http') ? service.image : `${API_URL.replace('/api', '')}${service.image}`} alt={service.libelle} className="w-full h-full object-cover" loading="lazy" />
                      {service.express_disponible && (
                        <div className="absolute top-1 right-1">
                          <Badge variant="warning" className="text-[9px] px-1 py-0 shadow-sm backdrop-blur-md bg-warning-500/90 text-white border-none">
                            <Sparkles className="w-2 h-2 mr-0.5" /> Exp
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-24 w-full shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-b border-white/10 relative">
                      <ShoppingCart className="w-8 h-8 text-primary-300 dark:text-primary-800" />
                    </div>
                  )}

                  <div className="p-3 flex-1 flex flex-col justify-between relative z-20">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">{service.libelle}</p>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-2">{formatCurrency(service.tarif_unitaire)}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            {filteredServices.length === 0 && (
              <div className="text-center py-10 text-neutral-500">Aucun service trouvé.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
