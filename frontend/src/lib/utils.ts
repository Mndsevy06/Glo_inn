import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const currency = localStorage.getItem('pressing-gloria-currency') || 'CDF';
  const rateStr = localStorage.getItem('pressing-gloria-rate');
  const rate = rateStr ? Number(rateStr) : (Number(import.meta.env.VITE_EXCHANGE_RATE) || 2800);

  let finalAmount = amount;
  if (currency === 'USD') {
    finalAmount = amount / rate;
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(finalAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
