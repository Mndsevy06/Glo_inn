export type Role = 'client' | 'receptionniste' | 'gerant';

export interface User {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  role: Role;
  username: string;
  password?: string;
}

export interface Service {
  id: string;
  libelle: string;
  description: string;
  image: string;
  tarif_unitaire: number;
  categorie: string;
  actif: boolean;
  express_disponible: boolean;
  tarif_express?: number;
}

export type OrderStatus = 'depose' | 'en_cours' | 'pret' | 'retire';
export type ServiceType = 'Normal' | 'Express';
export type PaymentStatus = 'Non payee' | 'Payee';

export interface LigneCommande {
  id: string;
  id_service: string;
  service: Service;
  quantite: number;
  type_service: ServiceType;
  note_etat: string;
  sous_total: number;
}

export interface Order {
  id: string;
  id_client: string;
  client: User;
  id_receptionniste: string;
  receptionniste: User;
  date_reception: string;
  date_retrait_prevue: string;
  etat: OrderStatus;
  lignes: LigneCommande[];
  montant_total: number;
  statut_paiement: PaymentStatus;
}

export interface Invoice {
  id: string;
  id_commande: string;
  commande: Order;
  numero: string;
  qr_code: string;
  date_emission: string;
  montant_total: number;
  statut_paiement: PaymentStatus;
}

export interface Notification {
  id: string;
  id_utilisateur: string;
  message: string;
  lue: boolean;
  date_envoi: string;
}

export interface Payment {
  id: string;
  id_facture: string;
  montant: number;
  mode_paiement: 'Cash' | 'PawaPay';
  reference_pawapay?: string;
  date_paiement: string;
}
