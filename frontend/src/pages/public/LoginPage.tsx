import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { motion } from 'framer-motion';
import { Shirt, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      addToast('Veuillez remplir tous les champs', 'warning');
      return;
    }
    setLoading(true);

    const result = await login(username, password);

    if (result.success && result.role) {
      addToast('Connexion réussie !', 'success');
      if (result.role === 'client') {
        navigate('/client');
      } else {
        // receptionniste ou gerant
        navigate('/dashboard');
      }
    } else {
      addToast('Identifiants incorrects', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950">
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
              Bienvenue
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Connectez-vous au Pressing Gloria
            </p>
          </div>

          <div className="space-y-4">
            <GlassInput
              label="Nom d'utilisateur ou Email"
              placeholder="ex: jean_bosco ou jean@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<LogIn className="w-4 h-4" />}
            />
            <GlassInput
              label="Mot de passe ou Numéro de téléphone"
              type={showPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe ou téléphone"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              iconRight={
                <button onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <GlassButton
              variant="primary"
              size="lg"
              className="w-full mt-2"
              onClick={handleLogin}
              disabled={loading}
              icon={loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : undefined}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </GlassButton>

            <div className="text-center mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Pas encore de compte ?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                S'inscrire
              </button>
            </div>
          </div>


        </div>
      </motion.div>
    </div>
  );
}
