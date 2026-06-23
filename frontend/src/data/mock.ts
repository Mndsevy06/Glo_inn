import type { Service, User, Order, Invoice, Notification } from '@/types';

export const services: Service[] = [
  { id: 's1', libelle: 'Lavage & Repassage Chemise', description: 'Nettoyage délicat et repassage professionnel pour vos chemises de tous types.', image: 'https://images.pexels.com/photos/581087/pexels-photo-581087.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 3500, categorie: 'Hommes', actif: true, express_disponible: true, tarif_express: 5000 },
  { id: 's2', libelle: 'Nettoyage à Sec Veste', description: 'Nettoyage spécialisé pour vestes en cuir, laine, coton ou polyester.', image: 'https://images.pexels.com/photos/1484827/pexels-photo-1484827.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 8000, categorie: 'Hommes', actif: true, express_disponible: true, tarif_express: 12000 },
  { id: 's3', libelle: 'Repassage Pantalon', description: 'Repassage professionnel avec plis nets et durables.', image: 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 2500, categorie: 'Hommes', actif: true, express_disponible: true, tarif_express: 4000 },
  { id: 's4', libelle: 'Nettoyage Robe de Soirée', description: 'Soins premium pour robes délicates, dentelles et matières précieuses.', image: 'https://images.pexels.com/photos/1375736/pexels-photo-1375736.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 15000, categorie: 'Femmes', actif: true, express_disponible: true, tarif_express: 22000 },
  { id: 's5', libelle: 'Nettoyage Blouse', description: 'Nettoyage soigneux pour blouses professionnelles ou casual.', image: 'https://images.pexels.com/photos/1487834/pexels-photo-1487834.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 4000, categorie: 'Femmes', actif: true, express_disponible: true, tarif_express: 6000 },
  { id: 's6', libelle: 'Lavage Jupe', description: 'Nettoyage adapté pour toutes les matières de jupes.', image: 'https://images.pexels.com/photos/1484827/pexels-photo-1484827.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 3500, categorie: 'Femmes', actif: true, express_disponible: true, tarif_express: 5500 },
  { id: 's7', libelle: 'Nettoyage Tissu de Luxe', description: 'Soins spéciaux pour soie, cachemire, et textiles précieux.', image: 'https://images.pexels.com/photos/1125136/pexels-photo-1125136.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 20000, categorie: 'Nettoyage a sec', actif: true, express_disponible: true, tarif_express: 30000 },
  { id: 's8', libelle: 'Nettoyage Manteau', description: 'Nettoyage complet de manteaux d\'hiver, doudounes et pardessus.', image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 18000, categorie: 'Nettoyage a sec', actif: true, express_disponible: true, tarif_express: 26000 },
  { id: 's9', libelle: 'Traitement Taches', description: 'Traitement professionnel des taches difficiles sur toutes matières.', image: 'https://images.pexels.com/photos/581087/pexels-photo-581087.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 5000, categorie: 'Nettoyage a sec', actif: true, express_disponible: false },
  { id: 's10', libelle: 'Nettoyage Costume Complet', description: 'Nettoyage complet veste + pantalon de costume.', image: 'https://images.pexels.com/photos/1484827/pexels-photo-1484827.jpeg?auto=compress&cs=tinysrgb&w=800', tarif_unitaire: 12000, categorie: 'Hommes', actif: true, express_disponible: true, tarif_express: 18000 },
];

export const users: User[] = [
  { id: 'u1', nom: 'Jean Bosco', telephone: '0823456789', adresse: 'Avenue de la Paix, 45', role: 'client', username: 'jean_bosco', password: '123456' },
  { id: 'u2', nom: 'Marie Claire', telephone: '0891234567', adresse: 'Boulevard du 30 Juin, 12', role: 'client', username: 'marie_claire', password: '123456' },
  { id: 'u3', nom: 'Patrick Mutombo', telephone: '0812345678', adresse: 'Résidence Les Palmiers, 8', role: 'client', username: 'patrick_mut', password: '123456' },
  { id: 'u4', nom: 'Aline Kabuya', telephone: '0856789012', adresse: 'Rue de la Gombe, 22', role: 'client', username: 'aline_k', password: '123456' },
  { id: 'u5', nom: 'Sophie Lukusa', telephone: '0976543210', adresse: 'Avenue de la Liberte, 77', role: 'receptionniste', username: 'sophie_l', password: 'admin123' },
  { id: 'u6', nom: 'Didier Kalonji', telephone: '0908765432', adresse: 'Rond-point Kintambo, 3', role: 'gerant', username: 'didier_k', password: 'admin123' },
];

export const orders: Order[] = [
  {
    id: 'c1', id_client: 'u1', client: users[0], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-20T09:30:00', date_retrait_prevue: '2026-06-23', etat: 'pret',
    lignes: [
      { id: 'l1', id_service: 's1', service: services[0], quantite: 3, type_service: 'Normal', note_etat: 'Bouton manquant sur la chemise bleue', sous_total: 10500 },
      { id: 'l2', id_service: 's3', service: services[2], quantite: 2, type_service: 'Express', note_etat: '', sous_total: 8000 },
    ],
    montant_total: 18500, statut_paiement: 'Payee',
  },
  {
    id: 'c2', id_client: 'u2', client: users[1], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-21T14:00:00', date_retrait_prevue: '2026-06-24', etat: 'en_cours',
    lignes: [
      { id: 'l3', id_service: 's4', service: services[3], quantite: 1, type_service: 'Normal', note_etat: 'Tache de vin rouge', sous_total: 15000 },
    ],
    montant_total: 15000, statut_paiement: 'Non payee',
  },
  {
    id: 'c3', id_client: 'u1', client: users[0], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-22T10:15:00', date_retrait_prevue: '2026-06-25', etat: 'depose',
    lignes: [
      { id: 'l4', id_service: 's2', service: services[1], quantite: 1, type_service: 'Normal', note_etat: '', sous_total: 8000 },
      { id: 'l5', id_service: 's10', service: services[9], quantite: 1, type_service: 'Express', note_etat: 'Couture dechiree', sous_total: 18000 },
    ],
    montant_total: 26000, statut_paiement: 'Non payee',
  },
  {
    id: 'c4', id_client: 'u3', client: users[2], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-19T16:00:00', date_retrait_prevue: '2026-06-22', etat: 'retire',
    lignes: [
      { id: 'l6', id_service: 's5', service: services[4], quantite: 2, type_service: 'Normal', note_etat: '', sous_total: 8000 },
    ],
    montant_total: 8000, statut_paiement: 'Payee',
  },
  {
    id: 'c5', id_client: 'u4', client: users[3], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-23T08:00:00', date_retrait_prevue: '2026-06-26', etat: 'depose',
    lignes: [
      { id: 'l7', id_service: 's7', service: services[6], quantite: 1, type_service: 'Normal', note_etat: 'Soie fragile', sous_total: 20000 },
    ],
    montant_total: 20000, statut_paiement: 'Non payee',
  },
  {
    id: 'c6', id_client: 'u2', client: users[1], id_receptionniste: 'u5', receptionniste: users[4],
    date_reception: '2026-06-23T11:30:00', date_retrait_prevue: '2026-06-23', etat: 'pret',
    lignes: [
      { id: 'l8', id_service: 's6', service: services[5], quantite: 3, type_service: 'Express', note_etat: '', sous_total: 16500 },
      { id: 'l9', id_service: 's3', service: services[2], quantite: 2, type_service: 'Express', note_etat: '', sous_total: 8000 },
    ],
    montant_total: 24500, statut_paiement: 'Non payee',
  },
];

export const invoices: Invoice[] = [
  { id: 'f1', id_commande: 'c1', commande: orders[0], numero: 'INV-2026-001', qr_code: 'https://pressing-gloria.com/track?c=c1', date_emission: '2026-06-20T09:30:00', montant_total: 18500, statut_paiement: 'Payee' },
  { id: 'f2', id_commande: 'c2', commande: orders[1], numero: 'INV-2026-002', qr_code: 'https://pressing-gloria.com/track?c=c2', date_emission: '2026-06-21T14:00:00', montant_total: 15000, statut_paiement: 'Non payee' },
  { id: 'f3', id_commande: 'c3', commande: orders[2], numero: 'INV-2026-003', qr_code: 'https://pressing-gloria.com/track?c=c3', date_emission: '2026-06-22T10:15:00', montant_total: 26000, statut_paiement: 'Non payee' },
  { id: 'f4', id_commande: 'c4', commande: orders[3], numero: 'INV-2026-004', qr_code: 'https://pressing-gloria.com/track?c=c4', date_emission: '2026-06-19T16:00:00', montant_total: 8000, statut_paiement: 'Payee' },
  { id: 'f5', id_commande: 'c5', commande: orders[4], numero: 'INV-2026-005', qr_code: 'https://pressing-gloria.com/track?c=c5', date_emission: '2026-06-23T08:00:00', montant_total: 20000, statut_paiement: 'Non payee' },
  { id: 'f6', id_commande: 'c6', commande: orders[5], numero: 'INV-2026-006', qr_code: 'https://pressing-gloria.com/track?c=c6', date_emission: '2026-06-23T11:30:00', montant_total: 24500, statut_paiement: 'Non payee' },
];

export const notifications: Notification[] = [
  { id: 'n1', id_utilisateur: 'u1', message: 'Votre commande INV-2026-001 est prete pour le retrait !', lue: false, date_envoi: '2026-06-23T08:00:00' },
  { id: 'n2', id_utilisateur: 'u1', message: 'Votre commande INV-2026-003 a ete deposee. Retrait prevu le 25/06.', lue: true, date_envoi: '2026-06-22T10:15:00' },
  { id: 'n3', id_utilisateur: 'u2', message: 'Votre commande INV-2026-002 est en cours de traitement.', lue: true, date_envoi: '2026-06-21T14:00:00' },
  { id: 'n4', id_utilisateur: 'u2', message: 'Votre commande INV-2026-006 est prete pour le retrait !', lue: false, date_envoi: '2026-06-23T16:00:00' },
  { id: 'n5', id_utilisateur: 'u3', message: 'Votre commande INV-2026-004 a ete retiree. Merci de votre confiance !', lue: true, date_envoi: '2026-06-22T10:00:00' },
  { id: 'n6', id_utilisateur: 'u4', message: 'Votre commande INV-2026-005 a ete deposee. Retrait prevu le 26/06.', lue: false, date_envoi: '2026-06-23T08:00:00' },
];

export const getClientNotifications = (clientId: string) => notifications.filter(n => n.id_utilisateur === clientId);
export const getClientOrders = (clientId: string) => orders.filter(o => o.id_client === clientId);
export const getClientInvoices = (clientId: string) => invoices.filter(i => i.commande.id_client === clientId);
