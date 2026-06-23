import { GlassCard } from '@/components/ui/GlassCard';
import { orders } from '@/data/mock';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, FileText, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { GlassButton } from '@/components/ui/GlassButton';

export function ReportsPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const revenueData = useMemo(() => {
    const data = [
      { date: 'Lun', revenus: 45000, commandes: 8 },
      { date: 'Mar', revenus: 62000, commandes: 12 },
      { date: 'Mer', revenus: 38000, commandes: 6 },
      { date: 'Jeu', revenus: 75000, commandes: 14 },
      { date: 'Ven', revenus: 91000, commandes: 18 },
      { date: 'Sam', revenus: 52000, commandes: 9 },
      { date: 'Dim', revenus: 34000, commandes: 5 },
    ];
    return data;
  }, []);

  const paymentMethodData = [
    { name: 'Cash', montant: 125000, count: 8 },
    { name: 'Mobile Money', montant: 210000, count: 14 },
    { name: 'Carte', montant: 85000, count: 5 },
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + o.montant_total, 0);
  const totalPaid = orders.filter(o => o.statut_paiement === 'Payee').reduce((sum, o) => sum + o.montant_total, 0);
  const totalUnpaid = totalRevenue - totalPaid;
  const avgOrder = totalRevenue / orders.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Rapports</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Analyse financiere et activite</p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Exporter PDF</GlassButton>
          <GlassButton variant="secondary" size="sm" icon={<FileText className="w-4 h-4" />}>Exporter Excel</GlassButton>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {(['7', '30', '90'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'glass-badge text-neutral-700 dark:text-neutral-300 hover:bg-white/50'
            }`}
          >
            {p} jours
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenus totaux', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
          { label: 'Payes', value: formatCurrency(totalPaid), icon: TrendingUp, color: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
          { label: 'Impayes', value: formatCurrency(totalUnpaid), icon: DollarSign, color: 'text-error-500', bg: 'bg-error-500/10', border: 'border-error-500/20' },
          { label: 'Panier moyen', value: formatCurrency(avgOrder), icon: TrendingUp, color: 'text-accent-500', bg: 'bg-accent-500/10', border: 'border-accent-500/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-5" hover={false}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center border ${stat.border}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/20 dark:border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Courbe des revenus</h2>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" stroke="rgba(0,0,0,0.3)" fontSize={12} />
                <YAxis stroke="rgba(0,0,0,0.3)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Area type="monotone" dataKey="revenus" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenus)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/20 dark:border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Repartition par mode de paiement</h2>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="rgba(0,0,0,0.3)" fontSize={12} />
                <YAxis stroke="rgba(0,0,0,0.3)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="montant" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
