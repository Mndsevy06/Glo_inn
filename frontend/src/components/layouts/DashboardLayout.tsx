import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users,
  BarChart3, LogOut, Moon, Sun, Shirt, Search, Bell, Menu, X,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const allSidebarItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['gerant', 'receptionniste'] },
  { path: '/dashboard/new-order', icon: ShoppingCart, label: 'Nouvelle Commande', roles: ['receptionniste'] },
  { path: '/dashboard/orders', icon: ClipboardList, label: 'Liste des Commandes', roles: ['receptionniste'] },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Rapports', roles: ['gerant'] },
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

  const handleLogout = () => {
    logout();
    addToast('Deconnecte avec succes', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
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
          <div className="p-3 border-t border-white/20 dark:border-white/10">
            <button
              onClick={toggle}
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
        <div className="glass-nav px-4 py-3 flex items-center justify-between lg:px-6">
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
            <button 
              className="relative p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
            </button>
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
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
