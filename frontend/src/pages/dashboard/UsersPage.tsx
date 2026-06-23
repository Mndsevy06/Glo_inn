import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { users } from '@/data/mock';
import { motion } from 'framer-motion';
import { User, Search, Plus, UserCheck, Shield, KeyRound } from 'lucide-react';
import { useState } from 'react';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', telephone: '', adresse: '', role: 'receptionniste' as const, username: '', password: '' });

  const filtered = users.filter((u) =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.telephone.includes(search)
  );

  const clients = filtered.filter((u) => u.role === 'client');
  const staff = filtered.filter((u) => u.role !== 'client');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Gestion des Employes</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Administrer les comptes du systeme</p>
        </div>
        <GlassButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewUser(true)}>
          Nouvel employe
        </GlassButton>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full pl-10 py-2 text-sm"
        />
      </div>

      {/* Staff Section */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          Personnel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{user.nom}</p>
                      <Badge variant={user.role === 'gerant' ? 'primary' : 'info'} className="text-[10px] px-2">
                        {user.role === 'gerant' ? 'Gerant' : 'Receptionniste'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.telephone}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{user.username}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10 flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 transition-colors">
                    <KeyRound className="w-3.5 h-3.5" />
                    Reinitialiser
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-error-500/10 hover:bg-error-500/20 text-error-600 transition-colors">
                    <UserCheck className="w-3.5 h-3.5" />
                    Desactiver
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Clients Section */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-secondary-500" />
          Clients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{user.nom}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.telephone}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{user.username}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Aucun utilisateur trouve.</p>
        </div>
      )}

      {/* New User Modal */}
      <Modal isOpen={showNewUser} onClose={() => setShowNewUser(false)} title="Nouvel employe" size="md">
        <div className="space-y-4">
          <GlassInput label="Nom complet" placeholder="Ex: Sophie Lukusa" value={newUser.nom} onChange={(e) => setNewUser({...newUser, nom: e.target.value})} />
          <GlassInput label="Nom d'utilisateur" placeholder="Ex: sophie_l" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
          <GlassInput label="Mot de passe" type="text" placeholder="Mot de passe genere" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
          <GlassInput label="Telephone" placeholder="Ex: 0976543210" value={newUser.telephone} onChange={(e) => setNewUser({...newUser, telephone: e.target.value})} />
          <GlassInput label="Adresse" placeholder="Ex: Rond-point Kintambo, 3" value={newUser.adresse} onChange={(e) => setNewUser({...newUser, adresse: e.target.value})} />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value as 'receptionniste' | 'gerant'})}
              className="glass-input w-full py-2.5"
            >
              <option value="receptionniste">Receptionniste</option>
              <option value="gerant">Gerant</option>
            </select>
          </div>
          <GlassButton variant="primary" className="w-full" onClick={() => setShowNewUser(false)}>
            Creer l'employe
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}
