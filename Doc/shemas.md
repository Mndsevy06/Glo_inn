# Analyse du Frontend et Modélisation de la Base de Données : Pressing Gloria

## 1. Analyse Détaillée du Frontend

Le frontend du projet "Pressing Gloria" est une application web monopage (SPA) robuste, développée avec React (via Vite) et TypeScript. L'interface utilisateur est construite avec une esthétique moderne "Glassmorphism" (composants translucides avec effets de flou), utilisant Tailwind CSS pour le style et Framer Motion pour des animations fluides.

L'architecture est structurée par rôles et cas d'usage, offrant des expériences distinctes pour les clients et le personnel :

### 1.1. Espace Public (`/src/pages/public/`)
*   **LandingPage** : Page d'accueil vitrine mettant en avant l'esthétique premium du pressing, les services clés (Nettoyage expert, Express) et guidant l'utilisateur vers la consultation du menu ou la connexion.
*   **MenuPage** : Catalogue public des services offerts, accessible sans authentification.
*   **LoginPage** : Point d'entrée sécurisé pour tous les acteurs (Clients, Réceptionnistes, Gérant).

### 1.2. Espace Client (`/src/pages/client/`)
Une interface orientée vers le suivi et la transparence pour l'utilisateur final.
*   **ClientHomePage** : Tableau de bord client affichant la commande active avec une timeline visuelle de progression (`Déposé` -> `En cours` -> `Prêt` -> `Retiré`). Met en évidence les actions urgentes (factures impayées) et les notifications non lues.
*   **ClientOrdersPage** : Historique détaillé des commandes. Permet de consulter les détails de chaque article (type de service, notes d'état, prix) et d'initier le paiement en ligne (intégration prévue avec CinetPay).
*   **ClientNotificationsPage** : Fil d'actualité des alertes système (ex: "Votre commande est prête").

### 1.3. Espace Dashboard (Personnel & Gérant) (`/src/pages/dashboard/`)
Une interface complexe et riche en données pour la gestion opérationnelle.
*   **DashboardHomePage** : Vue d'ensemble avec KPIs (Revenus, Commandes actives, Taux de paiement) et des graphiques interactifs (via `recharts`) illustrant les revenus hebdomadaires et la répartition des statuts de commande.
*   **NewOrderPage** : Composant critique pour la réceptionniste. Interface de type point de vente (POS) permettant de rechercher/créer un client, sélectionner des services (avec option normale/express), ajouter des notes de condition (ex: "bouton manquant"), et générer une facture avec aperçu avant impression.
*   **OrdersListPage** : Tableau de gestion complet des commandes avec filtres dynamiques (par statut, recherche texte). Permet la mise à jour de l'état d'avancement des commandes et la validation des paiements en espèces.
*   **ReportsPage** : Interface d'intelligence d'affaires (BI) pour le gérant. Présente une analyse approfondie via de multiples graphiques : revenus vs objectifs, top services, modes de paiement, performances horaires et satisfaction.
*   **UsersPage** : Gestion des accès et annuaire. Permet au gérant de créer de nouveaux comptes employés (réceptionnistes) et de consulter la liste des clients inscrits.

---

## 2. Modélisation de la Base de Données (Schéma Relationnel)

Sur la base de l'analyse du cahier des charges et des structures de données (Mock) du frontend, voici la liste complète des tables et champs nécessaires pour le backend (PostgreSQL).

### 2.1. Table `Utilisateur` (User)
Gère tous les acteurs du système avec une gestion des rôles.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `nom` (String) : Nom complet de l'utilisateur.
*   `telephone` (String) : Numéro de téléphone (utilisé aussi pour la recherche).
*   `adresse` (String) : Adresse physique du client ou de l'employé.
*   `role` (Enum) : Rôle dans le système (`client`, `receptionniste`, `gerant`).
*   `username` (String) : Nom d'utilisateur unique pour la connexion.
*   `password` (String) : Mot de passe haché.
*   *Rôle : Centraliser l'authentification et l'identification des personnes interagissant avec le système.*

### 2.2. Table `Service`
Catalogue des prestations offertes par le pressing.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `libelle` (String) : Nom du service (ex: "Lavage & Repassage Chemise").
*   `description` (Text) : Description détaillée du soin.
*   `image` (String) : URL de l'image d'illustration.
*   `tarif_unitaire` (Decimal) : Prix de base du service.
*   `categorie` (String) : Catégorisation (ex: "Hommes", "Femmes", "Nettoyage à sec").
*   `actif` (Boolean) : Indique si le service est actuellement disponible au catalogue.
*   `express_disponible` (Boolean) : Indique si le service peut être réalisé en urgence.
*   `tarif_express` (Decimal, Nullable) : Prix majoré si l'option express est choisie.
*   *Rôle : Servir de base tarifaire et descriptive pour le menu public et la création de commandes.*

### 2.3. Table `Commande` (Order)
Représente une transaction globale (le dépôt d'un panier de vêtements).
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `id_client` (UUID) : Clé Étrangère vers `Utilisateur`.
*   `id_receptionniste` (UUID) : Clé Étrangère vers `Utilisateur` (qui a pris la commande).
*   `date_reception` (DateTime) : Date et heure du dépôt.
*   `date_retrait_prevue` (Date) : Date convenue pour la récupération.
*   `etat` (Enum) : Statut de progression (`depose`, `en_cours`, `pret`, `retire`).
*   `montant_total` (Decimal) : Somme totale calculée des lignes de commande.
*   `statut_paiement` (Enum) : État financier global (`Non payee`, `Payee`).
*   *Rôle : Suivre l'avancement global et consolider l'aspect financier d'un dépôt client.*

### 2.4. Table `LigneCommande` (Order Item)
Table intermédiaire détaillant chaque article d'une commande.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `id_commande` (UUID) : Clé Étrangère vers `Commande`.
*   `id_service` (UUID) : Clé Étrangère vers `Service`.
*   `quantite` (Integer) : Nombre de pièces pour ce service spécifique.
*   `type_service` (Enum) : Modalité de traitement (`Normal`, `Express`).
*   `note_etat` (String) : Observations sur le vêtement lors du dépôt (ex: "Tache de vin", "Bouton manquant") pour éviter les litiges.
*   `sous_total` (Decimal) : Coût calculé de cette ligne (tarif * quantité).
*   *Rôle : Permettre la granularité d'une commande (avoir plusieurs services différents dans le même dépôt) et conserver les notes de conditionnement.*

### 2.5. Table `Facture` (Invoice)
Document légal et financier lié à une commande.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `id_commande` (UUID) : Clé Étrangère vers `Commande` (Relation 1-to-1).
*   `numero` (String) : Numéro de facture formaté (ex: "INV-2026-001").
*   `qr_code` (String) : Chaîne de caractères ou URL encodée dans le QR Code imprimé.
*   `date_emission` (DateTime) : Date de création de la facture.
*   `montant_total` (Decimal) : Total facturé (devrait correspondre au montant de la commande).
*   `statut_paiement` (Enum) : État du règlement (`Non payee`, `Payee`).
*   *Rôle : Fournir un document traçable au client, supportant le QR code pour le concept "Phygital".*

### 2.6. Table `Paiement` (Payment)
Historique des règlements effectués.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `id_facture` (UUID) : Clé Étrangère vers `Facture`.
*   `montant` (Decimal) : Somme encaissée.
*   `mode_paiement` (Enum) : Canal de paiement (`Cash`, `CinetPay`).
*   `reference_cinetpay` (String, Nullable) : ID de transaction renvoyé par l'API CinetPay (si paiement en ligne).
*   `date_paiement` (DateTime) : Date et heure d'enregistrement du paiement.
*   *Rôle : Tracer avec précision les flux de trésorerie, séparer les liquidités des paiements digitaux.*

### 2.7. Table `Notification`
Système de messagerie asynchrone interne.
*   `id` (UUID) : Identifiant unique (Clé Primaire).
*   `id_utilisateur` (UUID) : Clé Étrangère vers `Utilisateur` (le destinataire).
*   `message` (String) : Contenu texte de l'alerte.
*   `lue` (Boolean) : Indique si l'utilisateur a pris connaissance du message (défaut : false).
*   `date_envoi` (DateTime) : Horodatage de l'émission.
*   *Rôle : Informer le client en temps réel des changements d'état de ses vêtements (ex: "Commande prête pour retrait").*
