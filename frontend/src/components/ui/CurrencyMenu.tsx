import { useState, useRef, useEffect } from 'react';
import { Coins, DollarSign, ChevronDown, Settings } from 'lucide-react';
import { authApi, configApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface CurrencyMenuProps {
  /** 'sidebar' = vertical full-width button (DashboardLayout), 'bottom-nav' = compact icon (ClientLayout) */
  variant?: 'sidebar' | 'bottom-nav';
  showSetRate?: boolean; // only true for gerant
}

export function CurrencyMenu({ variant = 'sidebar', showSetRate = false }: CurrencyMenuProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateInput, setRateInput] = useState(localStorage.getItem('pressing-gloria-rate') || '2800');
  const [currency, setCurrency] = useState(localStorage.getItem('pressing-gloria-currency') || 'CDF');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCurrency = async (newCurrency: 'CDF' | 'USD') => {
    setOpen(false);
    setCurrency(newCurrency);
    localStorage.setItem('pressing-gloria-currency', newCurrency);
    try {
      await authApi.updateSettings({ currency: newCurrency });
    } catch { }
    window.location.reload();
  };

  const saveRate = async () => {
    const num = Number(rateInput);
    if (isNaN(num) || num <= 0) {
      addToast('Taux invalide', 'error');
      return;
    }
    try {
      await configApi.update(num);
      localStorage.setItem('pressing-gloria-rate', rateInput);
      addToast(`Taux mis à jour : 1 USD = ${num} CDF`, 'success');
      setRateModalOpen(false);
      window.location.reload();
    } catch {
      addToast('Erreur lors de la mise à jour du taux', 'error');
    }
  };

  const label = currency === 'CDF' ? 'CDF' : 'USD';

  return (
    <div ref={menuRef} className="relative">

      {/* Trigger Button */}
      {variant === 'sidebar' ? (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-white/10 transition-all"
        >
          {currency === 'CDF' ? <Coins className="w-5 h-5 flex-shrink-0" /> : <DollarSign className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-left">Devise : {label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          {currency === 'CDF' ? <Coins className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 min-w-[190px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden
          ${variant === 'sidebar' ? 'bottom-full left-0 mb-2' : 'bottom-full left-1/2 -translate-x-1/2 mb-3'}
        `}>
          {/* CDF */}
          <button
            onClick={() => selectCurrency('CDF')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${currency === 'CDF' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-neutral-700 dark:text-neutral-200'}`}
          >
            <Coins className="w-4 h-4 flex-shrink-0" />
            <span>Francs Congolais (CDF)</span>
            {currency === 'CDF' && <span className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />}
          </button>

          {/* USD */}
          <button
            onClick={() => selectCurrency('USD')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${currency === 'USD' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-neutral-700 dark:text-neutral-200'}`}
          >
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>Dollars (USD)</span>
            {currency === 'USD' && <span className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />}
          </button>

          {/* Set rate — only for gerant */}
          {showSetRate && (
            <>
              <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-3" />
              <button
                onClick={() => { setOpen(false); setRateModalOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Définir le taux de change</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Rate Modal */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRateModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">Taux de change</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">Définissez combien de francs congolais vaut 1 dollar américain.</p>
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">1 USD =</label>
            <div className="flex items-center gap-2 mt-2 mb-6">
              <input
                type="number"
                min="1"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="2800"
              />
              <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">CDF</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveRate}
                className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
