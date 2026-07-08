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
  // La base de données stocke les prix en Francs Congolais (CDF)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const viewInvoice = (order: any, autoPrint = false) => {
  const windowPrint = window.open('', '', 'width=350,height=600');
  if (windowPrint) {
    windowPrint.document.write(`
<html><head><title>Facture #${order.id.split('-')[0].toUpperCase()}</title>
<style>
  body { font-family: monospace; margin: 0; padding: 20px; width: 80mm; color: #000; background: #fff; } 
  .text-center { text-align: center; } .text-left { text-align: left; } 
  .flex { display: flex; } .justify-between { justify-content: space-between; } 
  .font-bold { font-weight: bold; } .text-xl { font-size: 1.25rem; } 
  .text-xs { font-size: 0.75rem; } .text-base { font-size: 1rem; } 
  .text-sm { font-size: 0.875rem; } .mb-4 { margin-bottom: 1rem; } 
  .mb-2 { margin-bottom: 0.5rem; } .mb-1 { margin-bottom: 0.25rem; } 
  .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } 
  .mt-6 { margin-top: 1.5rem; } .pb-4 { padding-bottom: 1rem; } 
  .pb-2 { padding-bottom: 0.5rem; } .pt-4 { padding-top: 1rem; } 
  .pr-2 { padding-right: 0.5rem; } .border-b { border-bottom: 1px dashed black; } 
  .border-t { border-top: 1px dashed black; } .uppercase { text-transform: uppercase; } 
  .w-full { width: 100%; } .flex-1 { flex: 1; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head><body>
<div class="text-center mb-4 border-b pb-4">
  <h2 class="text-xl font-bold uppercase">Pressing Gloria</h2>
  <p class="text-xs mt-1">Numéro: ${order.facture?.numero || order.id.split('-')[0].toUpperCase()}</p>
  <p class="text-xs">${new Date(order.date_reception).toLocaleDateString('fr-FR')} ${new Date(order.date_reception).toLocaleTimeString('fr-FR')}</p>
</div>
<div class="mb-4 text-xs">
  <p><span class="font-bold">Client:</span> ${order.client?.nom}</p>
  <p><span class="font-bold">Tel:</span> ${order.client?.telephone}</p>
</div>
<div class="border-b pb-2 mb-2 text-xs">
  <div class="flex justify-between font-bold mb-1">
    <span>Article</span>
    <span>Total</span>
  </div>
  ${(order.lignes || []).map((item: any) => {
    const price = item.type_service === 'Express' && item.service?.tarif_express ? Number(item.service.tarif_express) : Number(item.service?.tarif_unitaire || 0);
    return `
    <div class="flex justify-between mb-1">
      <span class="flex-1 pr-2 text-left">
        ${item.quantite}x ${item.service?.libelle} ${item.type_service === 'Express' ? '(Exp)' : ''}
      </span>
      <span>${formatCurrency(price * item.quantite)}</span>
    </div>`;
  }).join('')}
</div>
<div class="flex justify-between font-bold text-base mt-2">
  <span>TOTAL</span>
  <span>${formatCurrency(Number(order.montant_total))}</span>
</div>
<div class="text-center mt-6 text-xs border-t pt-4">
  <p>Merci de votre visite !</p>
  <p>A bientôt chez Pressing Gloria</p>
</div>
${!autoPrint ? `
<div style="margin-top: 30px; text-align: center;" class="no-print">
  <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: sans-serif; font-weight: bold;">Imprimer la facture</button>
</div>
` : ''}
</body></html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    if (autoPrint) {
      setTimeout(() => {
        windowPrint.print();
        windowPrint.close();
      }, 500);
    }
  }
};
