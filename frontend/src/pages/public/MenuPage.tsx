import { GlassCard, GlassCardBody } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, ArrowLeft, Filter, Sparkles, RefreshCw, ShoppingBag, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Service {
  id: string;
  libelle: string;
  description: string;
  image: string | null;
  tarif_unitaire: string;
  categorie: string;
  actif: boolean;
  express_disponible: boolean;
  tarif_express: string | null;
}

export function MenuPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Public endpoint - no auth required, fetch services directly
    fetch(`${API_URL}/services`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(services.map(s => s.categorie)));

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlyExpress, setOnlyExpress] = useState(false);
  const [priceMax, setPriceMax] = useState<number | ''>('');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filtered = services.filter(s => {
    const matchSearch = s.libelle.toLowerCase().includes(search.toLowerCase()) || 
                        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(s.categorie);
    const matchExpress = !onlyExpress || s.express_disponible;
    const matchPrice = !priceMax || Number(s.tarif_unitaire) <= Number(priceMax);
    return matchSearch && matchCat && matchExpress && matchPrice;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors" title="Retour à l'accueil" aria-label="Retour à l'accueil">
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-display gradient-text">Nos Services</span>
            </div>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{filtered.length} service{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-3">
            Catalogue des Services
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            Découvrez tous nos services de nettoyage avec leurs tarifs. Libre consultation sans inscription.
          </p>
        </motion.div>

        {/* Search & Filter Trigger */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Rechercher un vêtement ou service..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" 
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-button text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 text-primary-600' : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10'}`}
            >
              <Filter className="w-4 h-4" /> Filtres Avancés
              {(selectedCategories.length > 0 || onlyExpress || priceMax !== '') && (
                <span className="w-2 h-2 rounded-full bg-primary-500 ml-1"></span>
              )}
            </button>

            {/* Filters Popover */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-40 p-5"
                >
                  <div className="space-y-6">
                    {/* Categories */}
                    <div>
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
                    </div>

                    {/* Price Max */}
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Prix maximum (CDF)</p>
                      <input 
                        type="number" 
                        placeholder="Ex: 5000" 
                        value={priceMax}
                        onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                        className="glass-input w-full px-4 py-2 text-sm" 
                      />
                    </div>

                    {/* Express */}
                    <div className="flex items-center justify-between glass-panel p-3 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Service Express</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setOnlyExpress(!onlyExpress)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${onlyExpress ? 'bg-warning-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                        title="Basculer Service Express"
                        aria-label="Basculer Service Express"
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyExpress ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setSelectedCategories([]);
                          setOnlyExpress(false);
                          setPriceMax('');
                          setSearch('');
                          setShowFilters(false);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Réinitialiser
                      </button>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Aucun service dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((service, i) => (
              <GlassCard key={service.id} delay={i} hover className="group">
                {/* Image or placeholder */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-500/10 to-secondary-500/20 flex items-center justify-center">
                  {service.image ? (
                    <img src={service.image.startsWith('http') ? service.image : `${API_URL.replace('/api', '')}${service.image}`} alt={service.libelle}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <Shirt className="w-16 h-16 text-primary-300 dark:text-primary-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {service.express_disponible && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="warning">
                        <Sparkles className="w-3 h-3 mr-1" /> Express
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                      {service.categorie}
                    </span>
                  </div>
                </div>
                <GlassCardBody>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{service.libelle}</h3>
                  {service.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(Number(service.tarif_unitaire))}
                      </span>
                      {service.express_disponible && service.tarif_express && (
                        <p className="text-xs text-warning-600 mt-1">
                          Express : {formatCurrency(Number(service.tarif_express))}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCardBody>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
