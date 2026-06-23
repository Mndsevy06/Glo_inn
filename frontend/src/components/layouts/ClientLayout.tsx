import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ClipboardList, Bell, LogOut, Moon, Sun, Shirt, User } from 'lucide-react';

const navItems = [
  { path: '/client', icon: Home, label: 'Accueil' },
  { path: '/client/orders', icon: ClipboardList, label: 'Commandes' },
  { path: '/client/notifications', icon: Bell, label: 'Notifications' },
];

export function ClientLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    addToast('Deconnecte avec succes', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950 flex flex-col">
      {/* Header */}
      <div className="glass-nav px-4 py-3 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold font-display gradient-text text-sm">Gloria</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
              {isDark ? <Sun className="w-4 h-4 text-neutral-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      {/* User greeting */}
      <div className="max-w-lg mx-auto px-4 py-3 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Bienvenue</p>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{user?.nom}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 overflow-y-auto glass-scrollbar">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-0 w-8 h-0.5 bg-primary-500 rounded-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
