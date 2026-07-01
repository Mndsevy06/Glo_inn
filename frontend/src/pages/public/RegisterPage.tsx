import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { motion } from 'framer-motion';
import { Shirt, User, Phone, MapPin, AtSign, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreatePhoneChange = (val: string) => {
    setFormData(prev => {
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

  const handleRegister = async () => {
    if (!formData.nom || !formData.telephone || !formData.password) {
      addToast('Veuillez remplir tous les champs obligatoires (*)', 'warning');
      return;
    }
    setLoading(true);
    
    const cleanedName = formData.nom.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const suffix = formData.telephone.replace(/[^0-9]/g, '').slice(-4) || Math.random().toString(36).slice(2, 6);
    const generatedUsername = `c_${cleanedName}_${suffix}`;

    const payload = {
      nom: formData.nom,
      telephone: formData.telephone,
      username: generatedUsername,
      password: formData.password
    };
    
    const result = await register(payload);
    
    if (result.success) {
      addToast('Inscription réussie !', 'success');
      navigate('/client');
    } else {
      addToast(result.message || 'Erreur lors de l\'inscription', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 py-12">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-300/20 dark:bg-secondary-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors bg-white/10 dark:bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="glass-card-strong p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25 overflow-hidden bg-white">
              <img src="/logo.jpg" alt="Logo Gloria" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
              Inscription
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Créez un compte client Pressing Gloria
            </p>
          </div>

          <div className="space-y-4">
            <GlassInput
              label="Nom complet *"
              placeholder="ex: Jean Bosco"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              icon={<User className="w-4 h-4" />}
              inputClassName="!border-neutral-300 dark:!border-neutral-600 !transition-none focus:!ring-0 focus:!border-neutral-300 dark:focus:!border-neutral-600"
            />
            <GlassInput
              label="Email *"
              placeholder="ex: client@example.com"
              value={formData.telephone}
              onChange={(e) => handleCreatePhoneChange(e.target.value)}
              icon={<AtSign className="w-4 h-4" />}
              inputClassName="!border-neutral-300 dark:!border-neutral-600 !transition-none focus:!ring-0 focus:!border-neutral-300 dark:focus:!border-neutral-600"
            />
            <GlassInput
              label="Mot de passe *"
              type={showPassword ? 'text' : 'password'}
              placeholder="Saisir ou modifier le mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              iconRight={
                <button onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              icon={<Key className="w-4 h-4" />}
              inputClassName="!border-neutral-300 dark:!border-neutral-600 !transition-none focus:!ring-0 focus:!border-neutral-300 dark:focus:!border-neutral-600"
            />
            <GlassButton
              variant="primary"
              size="lg"
              className="w-full mt-2"
              onClick={handleRegister}
              disabled={loading}
              icon={loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : undefined}
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </GlassButton>
            
            <div className="text-center mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Déjà un compte ?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
