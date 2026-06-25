import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, FileText, Download, Activity, Target, Award, Zap, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Line, Legend, ComposedChart,
} from 'recharts';
import { GlassButton } from '@/components/ui/GlassButton';
import { reportsApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

const tooltipStyle = {
  backgroundColor: 'rgba(10,10,20,0.85)',
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
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 1000 ? `${p.value.toLocaleString()} CDF` : p.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportsPage() {
  const { addToast } = useToast();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);

  const [kpiData, setKpiData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const p = parseInt(period, 10);
      const [kpis, daily, monthly, payments, services, hourly, performance] = await Promise.all([
        reportsApi.getKpis(p),
        reportsApi.getDaily(),
        reportsApi.getMonthly(),
        reportsApi.getPayments(p),
        reportsApi.getServices(p),
        reportsApi.getHourly(),
        reportsApi.getPerformance(p),
      ]);

      setKpiData(kpis);
      setDailyData(daily);
      setMonthlyData(monthly);
      setPaymentData(payments);
      setServiceData(services);
      setHourlyData(hourly);
      setPerformanceData(performance);
    } catch (err: any) {
      addToast(err.message || 'Erreur lors du chargement des rapports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Polling every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [period]);

  if (loading && !kpiData) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const exportCSV = () => {
    if (!kpiData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Indicateur,Valeur\n";
    csvContent += `Revenus totaux,${kpiData.totalRevenu}\n`;
    csvContent += `Montant paye,${kpiData.totalPaye}\n`;
    csvContent += `Impayes,${kpiData.totalImpaye}\n`;
    csvContent += `Panier moyen,${kpiData.avgOrder}\n`;
    csvContent += `Total commandes,${kpiData.totalCommandes}\n`;
    csvContent += `Taux de conversion,${kpiData.tauxConversion}%\n`;
    
    csvContent += "\nDate,Revenus,Express\n";
    dailyData.forEach(d => {
      csvContent += `${d.date},${d.revenus},${d.express}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_${period}_jours.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Rapport Analytique - Pressing Gloria", 14, 22);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Periode : Derniers ${period} jours`, 14, 30);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 35, 196, 35);
        
        doc.setFontSize(16);
        doc.setTextColor(60, 60, 60);
        doc.text("Indicateurs Cles de Performance", 14, 45);
        
        const kpiTableData = [
          ['Revenus totaux', formatCurrency(kpiData?.totalRevenu || 0)],
          ['Montant paye', formatCurrency(kpiData?.totalPaye || 0)],
          ['Impayes', formatCurrency(kpiData?.totalImpaye || 0)],
          ['Panier moyen', formatCurrency(kpiData?.avgOrder || 0)],
          ['Total commandes', `${kpiData?.totalCommandes || 0}`],
          ['Taux de conversion', `${kpiData?.tauxConversion || 0}%`]
        ];
        
        autoTable(doc, {
          startY: 50,
          head: [['Indicateur', 'Valeur']],
          body: kpiTableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
        });

        const finalY = (doc as any).lastAutoTable.finalY || 50;

        doc.setFontSize(16);
        doc.text("Top Services par Commandes", 14, finalY + 15);
        
        const serviceTableData = serviceData.map(s => [s.service, s.commandes, formatCurrency(s.revenus)]);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Service', 'Commandes', 'Revenus']],
          body: serviceTableData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(`Genere le ${new Date().toLocaleDateString()} - Page ${i} sur ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        }
        
        doc.save(`Rapport_Gloria_${period}_jours.pdf`);
      });
    });
  };

  const kpis = [
    { label: 'Revenus totaux', value: formatCurrency(kpiData?.totalRevenu || 0), icon: DollarSign, color: 'from-indigo-500 to-purple-600', trend: kpiData?.trends?.revenu, up: kpiData?.up?.revenu },
    { label: 'Montant payé', value: formatCurrency(kpiData?.totalPaye || 0), icon: Award, color: 'from-emerald-500 to-teal-600', trend: kpiData?.trends?.paye, up: kpiData?.up?.paye },
    { label: 'Impayés', value: formatCurrency(kpiData?.totalImpaye || 0), icon: Target, color: 'from-rose-500 to-pink-600', trend: kpiData?.trends?.impaye, up: kpiData?.up?.impaye },
    { label: 'Panier moyen', value: formatCurrency(kpiData?.avgOrder || 0), icon: Zap, color: 'from-amber-500 to-orange-600', trend: kpiData?.trends?.avg, up: kpiData?.up?.avg },
    { label: 'Total commandes', value: `${kpiData?.totalCommandes || 0}`, icon: Activity, color: 'from-cyan-500 to-blue-600', trend: kpiData?.trends?.commandes, up: kpiData?.up?.commandes },
    { label: 'Taux de conversion', value: `${kpiData?.tauxConversion || 0}%`, icon: TrendingUp, color: 'from-violet-500 to-purple-600', trend: kpiData?.trends?.taux, up: kpiData?.up?.taux },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display">Rapports & Analytiques</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Analyse complete de la performance</p>
        </div>
        
        <div className="flex items-center bg-white/50 dark:bg-neutral-800/50 p-1 rounded-xl shadow-inner mx-auto sm:mx-0">
          {(['7', '30', '90'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/30 dark:hover:bg-neutral-700/50'}`}>
              {p === '7' ? '7 jours' : p === '30' ? 'Ce mois' : '3 mois'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-4 h-4 text-primary-500 animate-spin mr-2" />}
          <GlassButton onClick={exportPDF} variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>PDF</GlassButton>
          <GlassButton onClick={exportCSV} variant="secondary" size="sm" icon={<FileText className="w-4 h-4" />}>Excel</GlassButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <GlassCard className="p-4" hover={false}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">{kpi.label}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{kpi.value}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Row 1: Area + Composed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Revenus & Commandes (semaine)</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Évolution quotidienne des revenus</p>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="gRevenu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="revenus" name="Revenus" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRevenu)" />
                <Area type="monotone" dataKey="express" name="Express" stroke="#ec4899" strokeWidth={2} fill="url(#gExpress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Monthly vs Objectif */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Revenus vs Objectifs (mensuel)</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Comparaison avec les objectifs fixés</p>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mois" stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenus" name="Revenus" fill="#6366f1" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                <Line type="monotone" dataKey="objectif" name="Objectif" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Services + Pie + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Bar */}
        <GlassCard className="lg:col-span-1" hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Top Services</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Commandes par type de service</p>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(148,163,184,0.5)" fontSize={10} />
                <YAxis dataKey="service" type="category" stroke="rgba(148,163,184,0.5)" fontSize={10} width={58} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="commandes" name="Commandes" radius={[0, 6, 6, 0]}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pie Paiements */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Modes de Paiement</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Répartition des transactions</p>
          </div>
          <div className="p-5 h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 flex-wrap justify-center">
              {paymentData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-neutral-500">{d.name} <span className="font-bold text-neutral-700 dark:text-neutral-300">{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Radar Performance */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Score de Performance</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Analyse multi-dimensionnelle</p>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(148,163,184,0.3)" fontSize={9} />
                <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Hourly + Service Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Flux de Commandes par Heure</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Heures de pointe aujourd'hui</p>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="gHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="heure" stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="commandes" name="Commandes" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gHour)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Revenue by Service */}
        <GlassCard hover={false}>
          <div className="p-5 border-b border-white/10">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Revenus par Service (CDF)</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Contribution financière de chaque service</p>
          </div>
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="service" stroke="rgba(148,163,184,0.5)" fontSize={9} />
                <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenus" name="Revenus" radius={[6, 6, 0, 0]}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
