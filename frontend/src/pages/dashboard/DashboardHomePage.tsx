import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, Package, CheckCircle, AlertCircle, ArrowUpRight, Star, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const tooltipStyle = {
  backgroundColor: 'rgba(10,10,20,0.9)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle} className="p-3">
        <p className="font-semibold text-indigo-300 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 999 ? `${p.value.toLocaleString()} CDF` : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardHomePage() {
  const { addToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const stats = await dashboardApi.getStats();
      setData(stats);
    } catch (err: any) {
      addToast(err.message || 'Erreur lors du chargement du tableau de bord', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const { kpis: kpiData, weekData, statusData, recentOrders, activity } = data || {};

  const kpis = [
    { label: 'Revenus du jour', value: formatCurrency(kpiData?.revenusJour || 0), sub: `${kpiData?.revenusEvolution || '0%'} vs hier`, icon: DollarSign, gradient: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-500/30' },
    { label: 'Commandes actives', value: `${kpiData?.commandesActives || 0}`, sub: `${kpiData?.commandesPretes || 0} prêtes`, icon: ShoppingBag, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
    { label: 'Clients enregistrés', value: `${kpiData?.clientCount || 0}`, sub: `+${kpiData?.nouveauxClients || 0} nouveaux`, icon: Users, gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/30' },
    { label: 'Taux de paiement', value: `${kpiData?.tauxPaiement || 0}%`, sub: `${kpiData?.payeesCount || 0} factures payées`, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Tableau de bord</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Vue d'ensemble de l'activité du Pressing Gloria</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard className="p-5" hover={false}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg ${kpi.glow}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                    <ArrowUpRight className="w-3 h-3" />{kpi.sub.split('%')[0]}%
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{kpi.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{kpi.sub}</p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Row 2: Revenue Chart + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Revenus de la semaine</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Revenus et commandes quotidiennes</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-full">{formatCurrency(weekData?.reduce((s: any, d: any) => s + d.revenus, 0) || 0)}</span>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData || []}>
                <defs>
                  <linearGradient id="gDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="revenus" name="Revenus" stroke="#6366f1" strokeWidth={2.5} fill="url(#gDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Status Pie */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Statut Commandes</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Répartition en temps réel</p>
          </div>
          <div className="p-5 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                  {(statusData || []).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full mt-2">
              {(statusData || []).map((s: any) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-neutral-500">{s.name}</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Orders table + Commandes bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commandes Bar */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Commandes/jour</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Volume de commandes cette semaine</p>
          </div>
          <div className="p-5 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="commandes" name="Commandes" radius={[6, 6, 0, 0]}>
                  {(weekData || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Recent Orders */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Commandes récentes</h2>
            <span className="text-xs text-neutral-500">Aujourd'hui</span>
          </div>
          <div className="p-4 space-y-2">
            {(recentOrders || []).map((order: any, i: number) => (
              <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.client.nom}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      order.etat === 'pret' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      order.etat === 'en_cours' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      order.etat === 'retire' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {order.etat === 'pret' ? '✓ Prêt' : order.etat === 'en_cours' ? '⟳ En cours' : order.etat === 'retire' ? '✓ Retiré' : '↓ Déposé'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{order.lignesCount} article(s) · {order.id.toUpperCase()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{order.montant_total.toLocaleString()}</p>
                  <span className={`text-xs ${order.statut_paiement === 'Payee' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {order.statut_paiement === 'Payee' ? '✓ Payée' : '✗ Impayée'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Row 4: Activity indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: 'Payées', value: `${activity?.payeesCount || 0}/${activity?.totalCommandes || 0}`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Clock, label: 'Délai moyen', value: `${activity?.delaiMoyen || '0'} jours`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { icon: AlertCircle, label: 'Impayées', value: `${activity?.impayeesCount || 0}`, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { icon: Star, label: 'Satisfaction', value: `${activity?.satisfaction || 0}%`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <GlassCard className="p-4 flex items-center gap-3" hover={false}>
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
