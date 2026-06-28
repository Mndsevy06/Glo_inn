import { GlassButton } from '@/components/ui/GlassButton';
import { motion } from 'framer-motion';
import { Sparkles, Shirt, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-300/20 dark:bg-secondary-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-300/20 dark:bg-accent-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-nav px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 overflow-hidden bg-white">
                <img src="/logo.jpg" alt="Logo Gloria" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold font-display gradient-text">Pressing Gloria</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Se connecter
              </button>
              <GlassButton variant="primary" size="sm" onClick={() => navigate('/register')} icon={<ArrowRight className="w-4 h-4" />}>
                S'inscrire
              </GlassButton>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 glass-badge mb-6">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Pressing de luxe digital</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-6 leading-tight">
              Prenez soin de vos{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                vetements
              </span>
              {' '}avec elegance
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Decouvrez un pressing haut de gamme qui combine expertise traditionnelle et technologie moderne. Suivi en temps reel, paiement digital, et service premium.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GlassButton variant="primary" size="lg" onClick={() => navigate('/register')} icon={<ArrowRight className="w-5 h-5" />}>
                Créer un compte
              </GlassButton>
              <GlassButton variant="secondary" size="lg" onClick={() => navigate('/menu')}>
                Voir nos services
              </GlassButton>
              <GlassButton variant="secondary" size="lg" onClick={() => navigate('/login')} className="hidden sm:flex">
                Se connecter
              </GlassButton>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 w-full"
          >
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Nettoyage Expert</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Des soins specialises pour toutes les matieres et les tissus les plus delicats.</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary-500/10 dark:bg-secondary-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Service Express</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Besoin d'urgence ? Retirez vos vetements dans la journee avec notre option express.</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Satisfaction Garantie</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Notes d'etat, tracabilite et paiement securise pour votre tranquillite.</p>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="glass-nav px-6 py-4 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pressing Gloria — Kinshasa, RDC</p>
        </footer>
      </div>
    </div>
  );
}
