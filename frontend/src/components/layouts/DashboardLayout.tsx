import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users,
  BarChart3, LogOut, Moon, Sun, Shirt, Search, Menu, X, Bell,
  ChevronRight, UtensilsCrossed, Coins, DollarSign, Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { authApi, configApi, usersApi } from '@/lib/api';
import { CurrencyMenu } from '@/components/ui/CurrencyMenu';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { Modal } from '@/components/ui/Modal';
import { UserPlus } from 'lucide-react';

const allSidebarItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['gerant', 'receptionniste'] },
  { path: '/dashboard/orders', icon: ClipboardList, label: 'Liste des Commandes', roles: ['receptionniste'] },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Rapports', roles: ['gerant', 'receptionniste'] },
  { path: '/dashboard/menu', icon: UtensilsCrossed, label: 'Gestion du Menu', roles: ['gerant', 'receptionniste'] },
  { path: '/dashboard/users', icon: Users, label: 'Utilisateurs', roles: ['gerant'] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClient, setNewClient] = useState({ nom: '', telephone: '', password: '123456' });

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateInput, setRateInput] = useState(localStorage.getItem('pressing-gloria-rate') || '2800');

  const currentCurrency = localStorage.getItem('pressing-gloria-currency') || 'CDF';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleCreateClient = async () => {
    if (!newClient.nom || !newClient.telephone || !newClient.password) {
      addToast('Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }
    const cleanedName = newClient.nom.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const suffix = newClient.telephone.replace(/[^0-9]/g, '').slice(-4) || Math.random().toString(36).slice(2, 6);
    const generatedUsername = `c_${cleanedName}_${suffix}`;

    try {
      await usersApi.create({
        nom: newClient.nom,
        telephone: newClient.telephone,
        adresse: '',
        role: 'client',
        username: generatedUsername,
        password: newClient.password
      });
      addToast('Client créé avec succès.', 'success');
      setShowCreateClient(false);
      setNewClient({ nom: '', telephone: '', password: '123456' });
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de la création.', 'error');
    }
  };

  const saveRate = async () => {
    const num = Number(rateInput);
    if (isNaN(num) || num <= 0) {
      addToast('Taux invalide', 'error');
      return;
    }
    try {
      await configApi.update(num);
      localStorage.setItem('pressing-gloria-rate', rateInput);
      addToast(`Taux mis à jour : 1 USD = ${num} CDF`, 'success');
      setRateModalOpen(false);
      window.location.reload();
    } catch {
      addToast('Erreur lors de la mise à jour du taux', 'error');
    }
  };

  const toggleThemeAndSave = async () => {
    toggle();
    const newTheme = isDark ? 'light' : 'dark';
    try {
      await authApi.updateSettings({ theme: newTheme });
    } catch { }
  };

  const toggleCurrency = async () => {
    const newCurrency = currentCurrency === 'CDF' ? 'USD' : 'CDF';
    localStorage.setItem('pressing-gloria-currency', newCurrency);
    try {
      await authApi.updateSettings({ currency: newCurrency });
    } catch { }
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    addToast('Deconnecte avec succes', 'info');
    navigate('/');
  };

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-sidebar transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold font-display gradient-text">Gloria</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Pressing Digital</p>
            </div>
          </div>

          {/* User */}
          <div className="px-4 pb-4">
            <div className="glass-panel p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.nom.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user?.nom}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {allSidebarItems.filter(item => item.roles.includes(user?.role || 'receptionniste')).map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/20 dark:border-white/10 space-y-1">
            <CurrencyMenu variant="sidebar" showSetRate={user?.role === 'gerant'} />
            <button
              onClick={toggleThemeAndSave}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-white/10 transition-all"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="flex-1 text-left">{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left">Deconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="glass-nav px-4 py-3 flex items-center justify-between lg:px-6 relative z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              title={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-64 pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'receptionniste' && (
              <button 
                onClick={() => setShowCreateClient(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium"
                aria-label="Créer Client"
                title="Créer Client"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau Client</span>
              </button>
            )}

            {user?.role !== 'gerant' && user?.role !== 'receptionniste' && (
              <button 
                className="relative p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              </button>
            )}
            
            <div className="relative" ref={settingsRef}>
              <button
                ref={settingsBtnRef}
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                aria-label="Paramètres"
                title="Paramètres"
              >
                <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-[9999]"
                  >
                    <button
                      onClick={() => { toggleThemeAndSave(); setSettingsOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
                    </button>
                    <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-3" />
                    <button
                      onClick={() => { toggleCurrency(); setSettingsOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {currentCurrency === 'CDF' ? <DollarSign className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                      <span>Passer en {currentCurrency === 'CDF' ? 'USD' : 'CDF'}</span>
                    </button>
                    {user?.role === 'gerant' && (
                      <>
                        <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-3" />
                        <button
                          onClick={() => { setSettingsOpen(false); setRateModalOpen(true); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Définir le taux de change</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto glass-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet context={{ searchQuery }} />
          </motion.div>
        </main>
      </div>

      {/* Create Client Modal */}
      <Modal isOpen={showCreateClient} onClose={() => setShowCreateClient(false)} title="Nouveau client" size="md">
        <div className="space-y-4">
          <GlassInput 
            label="Nom complet *" 
            placeholder="Ex: Jean Dupont" 
            value={newClient.nom} 
            onChange={(e) => setNewClient({...newClient, nom: e.target.value})} 
          />
          <GlassInput 
            label="Téléphone ou Email *" 
            placeholder="Ex: 082444555 ou client@example.com" 
            value={newClient.telephone} 
            onChange={(e) => handleCreatePhoneChange(e.target.value)} 
          />
          <GlassInput 
            label="Mot de passe *" 
            type="text" 
            placeholder="Saisir ou modifier le mot de passe" 
            value={newClient.password} 
            onChange={(e) => setNewClient({...newClient, password: e.target.value})} 
          />
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={handleCreateClient}
          >
            Enregistrer le client
          </GlassButton>
        </div>
      </Modal>

      {/* Rate Modal */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRateModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">Taux de change</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">Définissez combien de francs congolais vaut 1 dollar américain.</p>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">1 USD =</label>
            <div className="flex items-center gap-2 mt-2 mb-6">
              <input
                type="number"
                min="1"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2800"
              />
              <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">CDF</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveRate}
                className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
