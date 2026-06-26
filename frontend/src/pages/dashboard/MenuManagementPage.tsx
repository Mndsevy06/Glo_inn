import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, RefreshCw, Sparkles, ToggleLeft, ToggleRight,
  ShoppingBag, Search, X, Filter
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { useOutletContext } from 'react-router-dom';
import { servicesApi, type ApiService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = ['Chemise', 'Pantalon', 'Veste', 'Robe', 'Manteau', 'Linge de maison', 'Autre'];

const emptyForm = {
  libelle: '',
  description: '',
  tarif_unitaire: '',
  categorie: '',
  express_disponible: false,
  tarif_express: '',
  actif: true,
  image_url: '',
};

export function MenuManagementPage() {
  const { addToast } = useToast();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { searchQuery } = useOutletContext<{ searchQuery: string }>() || { searchQuery: '' };

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<ApiService | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await servicesApi.getAllAdmin();
      setServices(data);
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur chargement services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = Array.from(new Set(services.map(s => s.categorie)));

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [onlyExpress, setOnlyExpress] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'tous' | 'actifs' | 'inactifs'>('tous');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filtered = services.filter(s => {
    const term = search || searchQuery || '';
    const matchSearch = s.libelle.toLowerCase().includes(term.toLowerCase()) ||
                        (s.description && s.description.toLowerCase().includes(term.toLowerCase()));
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(s.categorie);
    const matchExpress = !onlyExpress || s.express_disponible;
    const matchStatus = statusFilter === 'tous' ? true : (statusFilter === 'actifs' ? s.actif : !s.actif);
    return matchSearch && matchCat && matchExpress && matchStatus;
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);

  const openCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setImageFile(null);
    setStep(1);
    setShowFormModal(true);
  };

  const openEdit = (s: ApiService) => {
    setEditingService(s);
    setForm({
      libelle: s.libelle,
      description: s.description || '',
      tarif_unitaire: String(s.tarif_unitaire),
      categorie: s.categorie,
      express_disponible: s.express_disponible,
      tarif_express: s.tarif_express ? String(s.tarif_express) : '',
      actif: s.actif,
      image_url: s.image && s.image.startsWith('http') ? s.image : '',
    });
    setImageFile(null);
    setStep(1);
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.libelle || !form.tarif_unitaire || !form.categorie) {
      addToast('Libellé, tarif et catégorie sont obligatoires.', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('libelle', form.libelle);
      formData.append('description', form.description);
      formData.append('tarif_unitaire', String(Number(form.tarif_unitaire)));
      formData.append('categorie', form.categorie);
      formData.append('express_disponible', String(form.express_disponible));
      if (form.express_disponible && form.tarif_express) {
        formData.append('tarif_express', String(Number(form.tarif_express)));
      }
      formData.append('actif', String(form.actif));
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('image_url', form.image_url);
      }

      if (editingService) {
        await servicesApi.update(editingService.id, formData);
        addToast('Service mis à jour avec succès.', 'success');
      } else {
        await servicesApi.create(formData);
        addToast('Service créé avec succès.', 'success');
      }
      setShowFormModal(false);
      fetchServices();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (s: ApiService) => {
    try {
      await servicesApi.updateStatus(s.id, { actif: !s.actif });
      addToast(`Service ${!s.actif ? 'activé' : 'désactivé'}.`, 'success');
      fetchServices();
    } catch (error) {
      const err = error as Error;
      addToast(err.message || 'Erreur.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await servicesApi.delete(toDelete.id);
      addToast('Service supprimé.', 'success');
      setShowDeleteModal(false);
      fetchServices();
    } catch (error: any) {
      // Service is used in orders — offer to deactivate instead
      if (error?.status === 409 || error?.response?.status === 409 || (error?.message && error.message.includes('commande'))) {
        setShowDeleteModal(false);
        addToast(
          `Ce service est utilisé dans des commandes. Il a été désactivé à la place.`,
          'warning'
        );
        // Auto-deactivate
        try {
          await servicesApi.updateStatus(toDelete.id, { actif: false });
          fetchServices();
        } catch {
          addToast('Impossible de désactiver le service.', 'error');
        }
      } else {
        addToast(error?.message || 'Erreur suppression.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Gestion du Menu</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Gérez les vêtements et services proposés à votre clientèle</p>
        </div>
        <GlassButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Ajouter un service
        </GlassButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total services', value: services.length, color: 'primary' },
          { label: 'Actifs', value: services.filter(s => s.actif).length, color: 'success' },
          { label: 'Inactifs', value: services.filter(s => !s.actif).length, color: 'error' },
          { label: 'Avec Express', value: services.filter(s => s.express_disponible).length, color: 'warning' },
        ].map(stat => (
          <GlassCard key={stat.label} hover={false} className={`p-4 flex items-center gap-4 bg-gradient-to-br from-${stat.color}-500/5 to-${stat.color}-500/10`}>
            <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center relative z-20">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Rechercher un service..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
        </div>
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-button text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 text-primary-600' : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10'}`}
          >
            <Filter className="w-4 h-4" /> Filtres
            {(selectedCategories.length > 0 || onlyExpress || statusFilter !== 'tous') && (
              <span className="w-2 h-2 rounded-full bg-primary-500 ml-1"></span>
            )}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-12 top-full mt-2 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-5"
              >
                <div className="space-y-6">
                  {/* Categories */}
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Catégories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                              isSelected
                                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                                : 'glass-badge text-neutral-600 dark:text-neutral-400 border-white/20 hover:bg-white/50'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Statut</p>
                    <div className="flex gap-2">
                      {['tous', 'actifs', 'inactifs'].map(st => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st as 'tous' | 'actifs' | 'inactifs')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors border ${
                            statusFilter === st
                              ? 'bg-primary-500 text-white border-primary-500'
                              : 'glass-badge text-neutral-600 dark:text-neutral-400 border-white/20 hover:bg-white/50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Express */}
                  <div className="flex items-center justify-between glass-panel p-3 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Service Express</p>
                    </div>
                    <button 
                      type="button" 
                      aria-label="Basculer Service Express"
                      title="Basculer Service Express"
                      onClick={() => setOnlyExpress(!onlyExpress)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${onlyExpress ? 'bg-warning-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyExpress ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setSelectedCategories([]);
                        setOnlyExpress(false);
                        setStatusFilter('tous');
                        setSearch('');
                        setShowFilters(false);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Réinitialiser
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={fetchServices} 
            aria-label="Rafraîchir les services"
            title="Rafraîchir les services"
            className="p-2.5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 text-neutral-500 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/20 dark:border-white/10 bg-white/10">
          <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">Aucun service trouvé.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-primary-500 hover:underline font-medium">
            + Ajouter le premier service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }} className="h-full">
                <GlassCard hover={false} className={`flex flex-col h-full overflow-hidden ${!service.actif ? 'opacity-60' : ''}`}>
                  {/* Image Preview Area */}
                  {service.image && (
                    <div className="h-32 w-full shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-b border-white/10">
                      <img src={service.image.startsWith('http') ? service.image : `${API_URL.replace('/api', '')}${service.image}`} alt={service.libelle} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-4 flex-1 space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">{service.libelle}</h3>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{service.categorie}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        {service.express_disponible && (
                          <Badge variant="warning" className="text-[10px]">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Express
                          </Badge>
                        )}
                        <Badge variant={service.actif ? 'success' : 'error'} className="text-[10px]">
                          {service.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{service.description}</p>
                    )}

                    {/* Pricing */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Prix Normal</span>
                        <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(Number(service.tarif_unitaire))}
                        </span>
                      </div>
                      {service.express_disponible && service.tarif_express && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-warning-600">Prix Express</span>
                          <span className="text-sm font-semibold text-warning-600 dark:text-warning-400">
                            {formatCurrency(Number(service.tarif_express))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-white/20 dark:border-white/10 flex items-center gap-2">
                    <button onClick={() => openEdit(service)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button 
                      onClick={() => handleToggleActive(service)}
                      aria-label={service.actif ? "Désactiver le service" : "Activer le service"}
                      title={service.actif ? "Désactiver le service" : "Activer le service"}
                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-neutral-500">
                      {service.actif ? <ToggleRight className="w-4 h-4 text-success-500" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => { setToDelete(service); setShowDeleteModal(true); }}
                      aria-label="Supprimer le service"
                      title="Supprimer le service"
                      className="p-1.5 rounded-lg hover:bg-error-500/10 transition-colors text-error-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
        title={editingService ? 'Modifier le service' : 'Nouveau service'} size="lg">
        
        {/* Step Indicator */}
        <div className="flex items-center mb-6 pt-2">
          <div className="flex-1">
            <div className={`h-2 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
            <p className={`text-xs mt-2 font-medium ${step >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500'}`}>1. Informations</p>
          </div>
          <div className="w-4" />
          <div className="flex-1">
            <div className={`h-2 rounded-full transition-colors ${step >= 2 ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
            <p className={`text-xs mt-2 font-medium ${step >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500'}`}>2. Tarification</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <GlassInput label="Libellé *" placeholder="Ex: Chemise homme" value={form.libelle}
                      onChange={e => setForm({ ...form, libelle: e.target.value })} />
                    
                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Catégorie *</label>
                      <select 
                        value={CATEGORIES.includes(form.categorie) ? form.categorie : 'Autre'}
                        onChange={e => {
                          if (e.target.value !== 'Autre') {
                            setForm({ ...form, categorie: e.target.value });
                          } else {
                            setForm({ ...form, categorie: '' });
                          }
                        }}
                        className="glass-input w-full px-4 py-2 text-sm appearance-none bg-transparent dark:bg-neutral-900/50"
                      >
                        <option value="" disabled className="bg-white dark:bg-neutral-900 text-neutral-500">Sélectionner une catégorie</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">{cat}</option>
                        ))}
                        <option value="Autre" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">Autre (personnalisé)...</option>
                      </select>
                      {!CATEGORIES.includes(form.categorie) && form.categorie !== '' && (
                        <input type="text" placeholder="Entrez la catégorie..." value={form.categorie}
                          onChange={e => setForm({ ...form, categorie: e.target.value })}
                          className="glass-input w-full px-4 py-2 mt-2 text-sm" />
                      )}
                      {!CATEGORIES.includes(form.categorie) && form.categorie === '' && (
                        <input type="text" placeholder="Saisir la nouvelle catégorie..."
                          onChange={e => setForm({ ...form, categorie: e.target.value })}
                          className="glass-input w-full px-4 py-2 mt-2 text-sm" autoFocus />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <GlassInput label="Description" placeholder="Description courte (optionnelle)..." value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />

                    {/* Image Input & Preview */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Image (URL ou Fichier)</label>
                      
                      {(imageFile || form.image_url || editingService?.image) && (
                        <div className="mb-3 h-32 w-full rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-white/20 dark:border-white/10 relative">
                          <img 
                            src={
                              imageFile ? URL.createObjectURL(imageFile) : 
                              form.image_url ? form.image_url : 
                              editingService?.image?.startsWith('http') ? editingService.image :
                              `${API_URL.replace('/api', '')}${editingService?.image}`
                            } 
                            alt="Aperçu" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Invalide';
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => { setImageFile(null); setForm({ ...form, image_url: '' }); if (editingService) editingService.image = null; }}
                            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="Coller l'URL d'une image (ex: https://...)" 
                          value={form.image_url}
                          onChange={e => {
                            setForm({ ...form, image_url: e.target.value });
                            setImageFile(null); // Clear file if url is used
                          }}
                          className="glass-input w-full px-4 py-2 text-sm"
                        />
                        <div className="relative glass-input flex items-center p-2 rounded-xl">
                          <input type="file" accept="image/*" onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                              setForm({ ...form, image_url: '' }); // Clear url if file is uploaded
                            }
                          }} className="w-full text-xs text-neutral-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 max-w-lg mx-auto w-full">
                <GlassInput label="Tarif Normal (CDF) *" type="number" placeholder="Ex: 2500" value={form.tarif_unitaire}
                  onChange={e => setForm({ ...form, tarif_unitaire: e.target.value })} />

                {/* Express toggle */}
                <div className="glass-panel p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Service Express disponible</p>
                      <p className="text-xs text-neutral-500">Traitement prioritaire en 24h</p>
                    </div>
                    <button 
                      type="button" 
                      aria-label="Basculer la disponibilité du service Express"
                      title="Basculer la disponibilité du service Express"
                      onClick={() => setForm({ ...form, express_disponible: !form.express_disponible })}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.express_disponible ? 'bg-warning-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.express_disponible ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {form.express_disponible && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <GlassInput label="Tarif Express (CDF)" type="number" placeholder="Ex: 4000" value={form.tarif_express}
                        onChange={e => setForm({ ...form, tarif_express: e.target.value })} />
                    </motion.div>
                  )}
                </div>

                {/* Actif toggle */}
                <div className="flex items-center justify-between glass-panel p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Visible sur le menu public</p>
                    <p className="text-xs text-neutral-500">Les clients pourront voir ce service</p>
                  </div>
                  <button 
                    type="button" 
                    aria-label="Basculer la visibilité du service"
                    title="Basculer la visibilité du service"
                    onClick={() => setForm({ ...form, actif: !form.actif })}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.actif ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.actif ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-6 pt-4 border-t border-white/20 dark:border-white/10">
            {step === 1 ? (
              <GlassButton variant="secondary" onClick={() => setShowFormModal(false)}>
                Annuler
              </GlassButton>
            ) : (
              <GlassButton variant="secondary" onClick={() => setStep(1)}>
                Précédent
              </GlassButton>
            )}

            {step === 1 ? (
              <GlassButton variant="primary" onClick={() => setStep(2)} disabled={!form.libelle || !form.categorie}>
                Suivant
              </GlassButton>
            ) : (
              <GlassButton variant="primary" onClick={handleSubmit} disabled={submitting || !form.tarif_unitaire}>
                {submitting ? 'Sauvegarde...' : (editingService ? 'Mettre à jour' : 'Publier le service')}
              </GlassButton>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le service" size="sm">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Êtes-vous sûr de vouloir supprimer <strong className="text-neutral-900 dark:text-neutral-100">"{toDelete?.libelle}"</strong> ?
            Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <GlassButton variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</GlassButton>
            <GlassButton variant="danger" className="flex-1" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
