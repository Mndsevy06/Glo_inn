import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, Bell, LogOut, Moon, Sun, Shirt, X, DollarSign, Coins, Plus, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { clientApi, authApi } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

import { ClientNotificationsPage } from '@/pages/client/ClientNotificationsPage';

export function ClientLayout() {
  const { logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const settingsRef = useRef<HTMLDivElement>(null);

  const [currency, setCurrency] = useState(localStorage.getItem('pressing-gloria-currency') || 'CDF');

  // Close settings dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initial fetch of unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await clientApi.getNotifications();
        setUnreadCount(notifs.filter((n: any) => !n.lue).length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
  }, [location.pathname]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    addToast('Deconnecte avec succes', 'info');
    navigate('/');
  };

  const toggleThemeAndSave = async () => {
    toggle();
    const newTheme = isDark ? 'light' : 'dark';
    try {
      await authApi.updateSettings({ theme: newTheme });
    } catch {
      // ignore
    }
    setSettingsOpen(false);
  };

  const toggleCurrency = async () => {
    const newCurrency = currency === 'CDF' ? 'USD' : 'CDF';
    setCurrency(newCurrency);
    localStorage.setItem('pressing-gloria-currency', newCurrency);
    try {
      await authApi.updateSettings({ currency: newCurrency });
    } catch {
      // ignore
    }
    setSettingsOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col pb-20">

      {/* Top Header */}
      <header className="glass-nav sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-display gradient-text">Gloria</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Notifications bell */}
          <button
            className="relative p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            onClick={() => setNotifModalOpen(true)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error-500 rounded-full border-2 border-white dark:border-neutral-900" />
            )}
          </button>

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Settings className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {/* Theme toggle */}
                  <button
                    onClick={toggleThemeAndSave}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
                  >
                    {isDark
                      ? <Sun className="w-4 h-4 text-warning-500" />
                      : <Moon className="w-4 h-4 text-primary-500" />}
                    <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
                  </button>

                  <div className="h-px bg-neutral-100 dark:bg-white/10 mx-3" />

                  {/* Currency toggle */}
                  <button
                    onClick={toggleCurrency}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
                  >
                    {currency === 'CDF'
                      ? <DollarSign className="w-4 h-4 text-success-500" />
                      : <Coins className="w-4 h-4 text-warning-500" />}
                    <span>Passer en {currency === 'CDF' ? 'USD' : 'CDF'}</span>
                  </button>

                  <div className="h-px bg-neutral-100 dark:bg-white/10 mx-3" />

                  {/* Logout */}
                  <button
                    onClick={() => { setSettingsOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-white/20 dark:border-white/10 px-6 py-3 flex justify-around items-center z-40 pb-safe">

        <button
          onClick={() => navigate('/client')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            location.pathname === '/client' ? 'text-primary-500' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <Home className={`w-6 h-6 ${location.pathname === '/client' ? 'fill-primary-500/20' : ''}`} />
          <span className="text-[10px] font-medium">Accueil</span>
        </button>

        <button
          onClick={() => navigate('/client/orders')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            location.pathname === '/client/orders' ? 'text-primary-500' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          <ClipboardList className={`w-6 h-6 ${location.pathname === '/client/orders' ? 'fill-primary-500/20' : ''}`} />
          <span className="text-[10px] font-medium">Commandes</span>
        </button>

        {/* Central floating Commander button */}
        <button
          onClick={() => navigate('/client/new-order')}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors -mt-6 relative"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 text-white">
            <Plus className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">Commander</span>
        </button>

        {/* Notifications shortcut in bottom nav */}
        <button
          onClick={() => setNotifModalOpen(true)}
          className="relative flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
          )}
          <span className="text-[10px] font-medium">Alertes</span>
        </button>

      </nav>

      {/* Notifications Slide Panel */}
      <AnimatePresence>
        {notifModalOpen && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
            onClick={() => setNotifModalOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-sm h-full bg-neutral-50 dark:bg-neutral-900 shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-neutral-500" />
                  <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Notifications</h2>
                </div>
                <button
                  onClick={() => setNotifModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="p-4">
                <ClientNotificationsPage isModal={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
