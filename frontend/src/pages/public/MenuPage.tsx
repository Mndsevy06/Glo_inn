import { GlassCard, GlassCardBody } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { services } from '@/data/mock';
import { motion } from 'framer-motion';
import { Shirt, ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = ['Tous', 'Hommes', 'Femmes', 'Nettoyage a sec'];

export function MenuPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filtered = activeCategory === 'Tous'
    ? services
    : services.filter((s) => s.categorie === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-30 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-display gradient-text">Nos Services</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-3">
            Catalogue des Services
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            Decouvrez tous nos services de nettoyage avec leurs tarifs. Libre consultation sans inscription.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'glass-badge text-neutral-700 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service, i) => (
            <GlassCard key={service.id} delay={i} hover={true} className="group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.libelle}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {service.express_disponible && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="warning">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Express
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                    {service.categorie}
                  </span>
                </div>
              </div>
              <GlassCardBody>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {service.libelle}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {service.tarif_unitaire.toLocaleString()} <span className="text-sm font-normal">CDF</span>
                    </span>
                    {service.express_disponible && service.tarif_express && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Express: {service.tarif_express.toLocaleString()} CDF
                      </p>
                    )}
                  </div>
                </div>
              </GlassCardBody>
            </GlassCard>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 dark:text-neutral-400">Aucun service dans cette categorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}
