import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCheck, Eye, Package } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { avisApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

function StarDisplay({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= note ? 'text-amber-400 fill-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
        />
      ))}
    </div>
  );
}

export function AvisPage() {
  const [avisList, setAvisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { addToast } = useToast();

  const fetchAvis = async () => {
    try {
      const data = await avisApi.getAll();
      setAvisList(data);
    } catch {
      addToast('Erreur lors du chargement des avis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAvis(); }, []);

  // Temps réel : nouvel avis reçu via WebSocket
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      setAvisList((prev) => {
        const exists = prev.find((a) => a.id === payload.avis.id);
        if (exists) return prev.map((a) => a.id === payload.avis.id ? payload.avis : a);
        return [payload.avis, ...prev];
      });
      addToast(`⭐ Nouvel avis de ${payload.clientNom} — commande #${payload.commandeRef}`, 'info');
    };
    socket.on('new_avis', handler);
    return () => socket.off('new_avis', handler);
  }, [socket]);

  const handleMarkRead = async (id: string) => {
    try {
      await avisApi.markRead(id);
      setAvisList((prev) => prev.map((a) => a.id === id ? { ...a, lu: true } : a));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await avisApi.markAllRead();
      setAvisList((prev) => prev.map((a) => ({ ...a, lu: true })));
      addToast('Tous les avis marqués comme lus.', 'success');
    } catch { /* silent */ }
  };

  const unreadCount = avisList.filter((a) => !a.lu).length;
  const avgNote = avisList.length
    ? (avisList.reduce((acc, a) => acc + a.note, 0) / avisList.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            Avis Clients
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Retours de vos clients sur leurs commandes payées
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer lu ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total avis', value: avisList.length, icon: MessageSquare, color: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Non lus', value: unreadCount, icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Note moyenne', value: `${avgNote} / 5`, icon: Star, color: 'text-success-500', bg: 'bg-success-500/10' },
        ].map((kpi) => (
          <GlassCard key={kpi.label} className="p-4 flex items-center gap-4" hover={false}>
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{kpi.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : avisList.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Aucun avis pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {avisList.map((avis, i) => (
              <motion.div
                key={avis.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard
                  className={`p-4 transition-all ${!avis.lu ? 'border-l-4 border-amber-400' : ''}`}
                  hover={false}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {avis.client?.nom?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {avis.client?.nom}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Commande #{avis.commande?.id?.split('-')[0]?.toUpperCase()}
                          </p>
                        </div>
                        {!avis.lu && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <StarDisplay note={avis.note} />
                      {avis.commentaire && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 italic">
                          "{avis.commentaire}"
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatDate(avis.createdAt)}
                      </p>
                    </div>

                    {!avis.lu && (
                      <button
                        onClick={() => handleMarkRead(avis.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                        title="Marquer comme lu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Marquer lu
                      </button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
