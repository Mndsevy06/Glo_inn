import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Search,
  Plus,
  UserCheck,
  Shield,
  KeyRound,
  Grid,
  List,
  ChevronDown,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  UserX
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { usersApi, type ApiUser, type UserStats, type UserRole } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

export function UsersPage() {
  const { addToast } = useToast();

  // Core Data States
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'line' | 'grid'>('line');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Dropdown States
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeActionsUserId, setActiveActionsUserId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>('client');
  const [newUser, setNewUser] = useState({
    nom: '',
    telephone: '',
    adresse: '',
    username: '',
    password: ''
  });

  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    nom: '',
    telephone: '',
    adresse: '',
    role: 'client' as UserRole,
    username: ''
  });

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  // Refs
  const addMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Toggle du menu d'actions avec position fixe calculée
  const handleToggleActions = (userId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event propagation so the click doesn't bubble up to window and immediately close the menu
    e.stopPropagation();
    
    if (activeActionsUserId === userId) {
      setActiveActionsUserId(null);
      setDropdownPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4, // position: fixed is relative to viewport, so no window.scrollY
      right: window.innerWidth - rect.right,
    });
    setActiveActionsUserId(userId);
  };

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      const isActionButton = (event.target as HTMLElement).closest('.actions-btn');
      const isActionMenu = actionsMenuRef.current && actionsMenuRef.current.contains(event.target as Node);
      if (!isActionButton && !isActionMenu) {
        setActiveActionsUserId(null);
        setDropdownPos(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        usersApi.getStats(),
        usersApi.getAll({
          role: roleFilter,
          search,
          page: currentPage,
          limit
        })
      ]);

      setStats(statsRes);

      // Local client-side filter for Status since backend handles search and role
      let filteredUsers = listRes.users;
      if (statusFilter === 'active') {
        filteredUsers = filteredUsers.filter(u => u.actif);
      } else if (statusFilter === 'inactive') {
        filteredUsers = filteredUsers.filter(u => !u.actif);
      }

      setUsers(filteredUsers);
      setTotalPages(listRes.pagination.totalPages);
      setTotalItems(listRes.pagination.total);
    } catch (error) {
      const err = error as Error;
      console.error(err);
      addToast(err.message || 'Impossible de récupérer les utilisateurs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter, search]);

  // Handle Search Input Change with local state
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleCreatePhoneChange = (val: string) => {
    setNewUser(prev => {
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

  const handleOpenCreateModal = (role: UserRole) => {
    setCreateRole(role);
    setNewUser({
      nom: '',
      telephone: '',
      adresse: '',
      username: '',
      password: '123456'
    });
    setShowAddMenu(false);
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.nom || !newUser.telephone || !newUser.password) {
      addToast('Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    // Auto-generate username behind the scenes
    const cleanedName = newUser.nom.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const suffix = newUser.telephone.replace(/[^0-9]/g, '').slice(-4) || Math.random().toString(36).slice(2, 6);
    const prefix = createRole === 'client' ? 'c' : createRole === 'receptionniste' ? 'r' : 'g';
    const generatedUsername = `${prefix}_${cleanedName}_${suffix}`;

    try {
      await usersApi.create({
        nom: newUser.nom,
        telephone: newUser.telephone,
        adresse: '',
        role: createRole,
        username: generatedUsername,
        password: newUser.password
      });
      addToast('Utilisateur créé avec succès.', 'success');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur lors de la création.', 'error');
    }
  };

  const handleOpenEditModal = (user: ApiUser) => {
    setEditForm({
      id: user.id,
      nom: user.nom,
      telephone: user.telephone,
      adresse: user.adresse || '',
      role: user.role,
      username: user.username
    });
    setActiveActionsUserId(null);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editForm.nom || !editForm.telephone || !editForm.username) {
      addToast('Champs obligatoires manquants.', 'warning');
      return;
    }

    try {
      await usersApi.update(editForm.id, {
        nom: editForm.nom,
        telephone: editForm.telephone,
        adresse: editForm.adresse,
        role: editForm.role,
        username: editForm.username
      });
      addToast('Utilisateur mis à jour.', 'success');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur de mise à jour.', 'error');
    }
  };

  const handleToggleActive = async (user: ApiUser) => {
    try {
      const res = await usersApi.toggleActive(user.id);
      addToast(res.message, 'success');
      setActiveActionsUserId(null);
      fetchData();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur lors de l\'activation/désactivation.', 'error');
    }
  };

  const handleOpenResetPassword = (user: ApiUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setActiveActionsUserId(null);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      addToast('Le mot de passe doit contenir au moins 6 caractères.', 'warning');
      return;
    }

    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      addToast('Mot de passe réinitialisé.', 'success');
      setShowResetPasswordModal(false);
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur de réinitialisation.', 'error');
    }
  };

  const handleOpenDeleteModal = (user: ApiUser) => {
    setUserToDelete(user);
    setActiveActionsUserId(null);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersApi.delete(userToDelete.id);
      addToast('Utilisateur supprimé avec succès.', 'success');
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur lors de la suppression.', 'error');
    }
  };

  const handleOpenDetails = (user: ApiUser) => {
    setSelectedUser(user);
    setActiveActionsUserId(null);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Gestion des Utilisateurs</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-sans">Administrer et configurer les comptes de Pressing Gloria</p>
        </div>

        {/* Centralized Add User Dropdown Button */}
        <div className="relative" ref={addMenuRef}>
          <GlassButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full sm:w-auto"
          >
            Ajouter utilisateur
            <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform duration-200", showAddMenu && "rotate-180")} />
          </GlassButton>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl z-30 overflow-hidden"
              >
                <div className="p-1">
                  <button
                    onClick={() => handleOpenCreateModal('client')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-500/10 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-secondary-500" />
                    Créer un Client
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal('receptionniste')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-500/10 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-info-500" />
                    Créer un Réceptionniste
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal('gerant')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-500/10 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-primary-500" />
                    Créer un Gérant
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hover={false} className="p-4 flex items-center gap-4 bg-gradient-to-br from-primary-500/5 to-secondary-500/5">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-500">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Utilisateurs</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats?.total ?? 0}</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-4 bg-gradient-to-br from-secondary-500/5 to-accent-500/5">
          <div className="p-3 rounded-xl bg-secondary-500/10 text-secondary-500">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Clients inscrits</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats?.clients ?? 0}</p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-4 bg-gradient-to-br from-info-500/5 to-primary-500/5">
          <div className="p-3 rounded-xl bg-info-500/10 text-info-500">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Personnel & Staff</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {(stats?.receptionnistes ?? 0) + (stats?.gerants ?? 0)}
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-4 flex items-center gap-4 bg-gradient-to-br from-success-500/5 to-emerald-500/5">
          <div className="p-3 rounded-xl bg-success-500/10 text-success-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Comptes Actifs</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats?.actifs ?? 0}</p>
          </div>
        </GlassCard>
      </div>

      {/* Filters and View Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou pseudo..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Smart Filter Dropdown */}
          <div className="relative" ref={filterMenuRef}>
            <GlassButton
              variant="secondary"
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              Filtres
              {(roleFilter !== 'all' || statusFilter !== 'all') && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded-full">
                  {(roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </GlassButton>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl z-20 p-4 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Rôle</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                      className="glass-input w-full py-2 px-3 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-white/10"
                      title="Filtrer par rôle"
                      aria-label="Filtrer par rôle"
                    >
                      <option value="all" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Tous les rôles</option>
                      <option value="client" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Client</option>
                      <option value="receptionniste" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Réceptionniste</option>
                      <option value="gerant" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Gérant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">Statut</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="glass-input w-full py-2 px-3 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-white/10"
                      title="Filtrer par statut"
                      aria-label="Filtrer par statut"
                    >
                      <option value="all" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Tous les statuts</option>
                      <option value="active" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Actifs</option>
                      <option value="inactive" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Inactifs</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex justify-end">
                    <button
                      onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setShowFilterMenu(false); }}
                      className="text-xs text-primary-500 hover:underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Toggles */}
          <div className="flex bg-white/50 dark:bg-white/5 p-1 rounded-xl border border-white/20 dark:border-white/10">
            <button
              onClick={() => setViewMode('line')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'line'
                  ? "bg-white dark:bg-neutral-800 shadow-sm text-primary-500"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
              title="Vue en liste"
              aria-label="Vue en liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid'
                  ? "bg-white dark:bg-neutral-800 shadow-sm text-primary-500"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
              title="Vue en grille"
              aria-label="Vue en grille"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 text-neutral-500 transition-colors"
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Users View list/grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl">
          <UserX className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 font-sans">Aucun utilisateur trouvé avec ces critères.</p>
        </div>
      ) : viewMode === 'line' ? (
        /* TABLE VIEW (LINE) */
        <div className="overflow-x-auto rounded-2xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-xl min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/5 text-xs uppercase font-semibold text-neutral-500 dark:text-neutral-400">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Téléphone</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date de Création</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10 text-sm text-neutral-700 dark:text-neutral-300">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-white/40 dark:hover:bg-white/5 transition-colors",
                    activeActionsUserId === user.id ? "relative z-30" : ""
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                        user.role === 'gerant' && "bg-gradient-to-br from-primary-500 to-accent-500",
                        user.role === 'receptionniste' && "bg-gradient-to-br from-info-500 to-primary-500",
                        user.role === 'client' && "bg-gradient-to-br from-secondary-500 to-accent-500"
                      )}>
                        {user.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{user.nom}</span>
                        {user.adresse && <p className="text-xs text-neutral-400 truncate max-w-[200px]">{user.adresse}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === 'gerant' ? 'primary' : user.role === 'receptionniste' ? 'info' : 'default'} className="capitalize text-xs font-medium">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {user.telephone.includes('@') ? '-' : user.telephone}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {user.telephone.includes('@') ? user.telephone : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.actif ? 'success' : 'error'} className="text-xs">
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => handleToggleActions(user.id, e)}
                      className="actions-btn p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors"
                      title="Options"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW (GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <GlassCard
              key={user.id}
              hover={false}
              className={cn(
                "p-5 flex flex-col justify-between relative min-h-[190px] transition-[z-index]",
                activeActionsUserId === user.id ? "z-30" : "z-10"
              )}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base",
                      user.role === 'gerant' && "bg-gradient-to-br from-primary-500 to-accent-500",
                      user.role === 'receptionniste' && "bg-gradient-to-br from-info-500 to-primary-500",
                      user.role === 'client' && "bg-gradient-to-br from-secondary-500 to-accent-500"
                    )}>
                      {user.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">{user.nom}</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">@{user.username}</p>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={(e) => handleToggleActions(user.id, e)}
                      className="actions-btn p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors"
                      title="Options"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {user.telephone.includes('@') ? (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-mono">{user.telephone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-mono">{user.telephone}</span>
                    </div>
                  )}
                  {user.adresse && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate">{user.adresse}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
                <Badge variant={user.role === 'gerant' ? 'primary' : user.role === 'receptionniste' ? 'info' : 'default'} className="capitalize text-[10px]">
                  {user.role}
                </Badge>
                <Badge variant={user.actif ? 'success' : 'error'} className="text-[10px]">
                  {user.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl">
          <p className="text-xs text-neutral-500">
            Affichage de <span className="font-semibold text-neutral-900 dark:text-neutral-100">{users.length}</span> sur <span className="font-semibold text-neutral-900 dark:text-neutral-100">{totalItems}</span> utilisateurs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
              title="Page précédente"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
              title="Page suivante"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Nouveau ${createRole === 'client' ? 'Client' : createRole === 'gerant' ? 'Gérant' : 'Réceptionniste'}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <GlassInput
            label="Nom complet *"
            placeholder="Ex: Jean Dupont"
            value={newUser.nom}
            onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
          />
          <GlassInput
            label="Téléphone ou Email *"
            placeholder="Ex: 082444555 ou client@example.com"
            value={newUser.telephone}
            onChange={(e) => handleCreatePhoneChange(e.target.value)}
          />
          <GlassInput
            label="Mot de passe *"
            type="text"
            placeholder="Saisir ou modifier le mot de passe"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />

          <div className="pt-2">
            <GlassButton variant="primary" className="w-full text-center" onClick={handleCreateUser}>
              Créer l'utilisateur
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier l'utilisateur"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <GlassInput
            label="Nom complet *"
            value={editForm.nom}
            onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
          />
          <GlassInput
            label="Téléphone ou Email *"
            value={editForm.telephone}
            onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 font-sans">Rôle</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              className="glass-input w-full py-2.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-white/10"
              title="Sélectionner le rôle"
              aria-label="Sélectionner le rôle"
            >
              <option value="client" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Client</option>
              <option value="receptionniste" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Réceptionniste</option>
              <option value="gerant" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Gérant</option>
            </select>
          </div>

          <div className="pt-2">
            <GlassButton variant="primary" className="w-full" onClick={handleUpdateUser}>
              Sauvegarder les modifications
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de l'utilisateur"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                selectedUser.role === 'gerant' && "bg-gradient-to-br from-primary-500 to-accent-500",
                selectedUser.role === 'receptionniste' && "bg-gradient-to-br from-info-500 to-primary-500",
                selectedUser.role === 'client' && "bg-gradient-to-br from-secondary-500 to-accent-500"
              )}>
                {selectedUser.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">{selectedUser.nom}</h3>
                <p className="text-xs text-neutral-400 font-mono">@{selectedUser.username}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Rôle :</span>
                <span className="font-medium text-neutral-950 dark:text-white capitalize">{selectedUser.role}</span>
              </div>
              {selectedUser.telephone.includes('@') ? (
                <div className="flex justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Email :</span>
                  <span className="font-medium text-neutral-950 dark:text-white font-mono">{selectedUser.telephone}</span>
                </div>
              ) : (
                <div className="flex justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Téléphone :</span>
                  <span className="font-medium text-neutral-950 dark:text-white font-mono">{selectedUser.telephone}</span>
                </div>
              )}
              {selectedUser.adresse && (
                <div className="flex justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Adresse :</span>
                  <span className="font-medium text-neutral-950 dark:text-white text-right max-w-[200px] truncate">{selectedUser.adresse}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Statut :</span>
                <Badge variant={selectedUser.actif ? 'success' : 'error'} className="text-xs font-semibold">
                  {selectedUser.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Inscrit le :</span>
                <span className="font-medium text-neutral-950 dark:text-white">{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => handleOpenEditModal(selectedUser)}>
                Modifier
              </GlassButton>
              <GlassButton variant="ghost" className="flex-1" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Réinitialiser le mot de passe"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Définissez un nouveau mot de passe de connexion pour <span className="font-semibold text-neutral-800 dark:text-neutral-200">@{selectedUser?.username}</span>.
          </p>
          <GlassInput
            label="Nouveau mot de passe *"
            type="password"
            placeholder="Entrez au moins 6 caractères"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <div className="pt-2 flex gap-3">
            <GlassButton variant="primary" className="flex-1" onClick={handleResetPassword}>
              Confirmer
            </GlassButton>
            <GlassButton variant="ghost" className="flex-1" onClick={() => setShowResetPasswordModal(false)}>
              Annuler
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="md"
      >
        <div className="space-y-5 pt-2">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement le compte de <span className="font-semibold text-neutral-800 dark:text-neutral-200">{userToDelete?.nom}</span> (Pseudo : @{userToDelete?.username}) ?
            Cette action est irréversible et supprimera l'ensemble de ses données.
          </p>

          <div className="pt-2 flex gap-3">
            <GlassButton variant="danger" className="flex-1" onClick={handleDeleteUser}>
              Supprimer définitivement
            </GlassButton>
            <GlassButton variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* ─── MENU ACTIONS GLOBAL (position: fixed — échappe au overflow) ─── */}
      {activeActionsUserId && dropdownPos && (() => {
        const u = users.find(x => x.id === activeActionsUserId);
        if (!u) return null;
        return (
          <div
            ref={actionsMenuRef}
            style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
            className="w-52 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/10 shadow-2xl py-1"
          >
            <button onClick={() => handleOpenDetails(u)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 text-left">
              <Eye className="w-3.5 h-3.5 text-neutral-400" /> Détails
            </button>
            <button onClick={() => handleOpenEditModal(u)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 text-left">
              <Edit2 className="w-3.5 h-3.5 text-neutral-400" /> Modifier
            </button>
            <button onClick={() => handleOpenResetPassword(u)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 text-left">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" /> Réinitialiser le mot de passe
            </button>
            <button onClick={() => handleToggleActive(u)} className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left", u.actif ? "text-error-600 hover:bg-error-500/10" : "text-success-600 hover:bg-success-500/10")}>
              <UserCheck className="w-3.5 h-3.5" /> {u.actif ? 'Désactiver' : 'Activer'}
            </button>
            <div className="border-t border-neutral-100 dark:border-white/10 my-1" />
            <button onClick={() => handleOpenDeleteModal(u)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-error-600 hover:bg-error-500/10 text-left font-medium">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        );
      })()}
    </div>
  );
}
