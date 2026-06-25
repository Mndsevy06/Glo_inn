-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'receptionniste', 'gerant');

-- CreateEnum
CREATE TYPE "EtatCommande" AS ENUM ('depose', 'en_cours', 'pret', 'retire');

-- CreateEnum
CREATE TYPE "TypeService" AS ENUM ('Normal', 'Express');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('Non_payee', 'Payee');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('Cash', 'CinetPay');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "role" "Role" NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "tarif_unitaire" DECIMAL(10,2) NOT NULL,
    "categorie" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "express_disponible" BOOLEAN NOT NULL DEFAULT false,
    "tarif_express" DECIMAL(10,2),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" UUID NOT NULL,
    "id_client" UUID NOT NULL,
    "id_receptionniste" UUID NOT NULL,
    "date_reception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_retrait_prevue" DATE NOT NULL,
    "etat" "EtatCommande" NOT NULL DEFAULT 'depose',
    "montant_total" DECIMAL(10,2) NOT NULL,
    "statut_paiement" "StatutPaiement" NOT NULL DEFAULT 'Non_payee',

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_commande" (
    "id" UUID NOT NULL,
    "id_commande" UUID NOT NULL,
    "id_service" UUID NOT NULL,
    "quantite" INTEGER NOT NULL,
    "type_service" "TypeService" NOT NULL DEFAULT 'Normal',
    "note_etat" TEXT,
    "sous_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "lignes_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" UUID NOT NULL,
    "id_commande" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "qr_code" TEXT,
    "date_emission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant_total" DECIMAL(10,2) NOT NULL,
    "statut_paiement" "StatutPaiement" NOT NULL DEFAULT 'Non_payee',

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" UUID NOT NULL,
    "id_facture" UUID NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL,
    "reference_cinetpay" TEXT,
    "date_paiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "id_utilisateur" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "date_envoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "utilisateurs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "factures_id_commande_key" ON "factures"("id_commande");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_id_receptionniste_fkey" FOREIGN KEY ("id_receptionniste") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_id_service_fkey" FOREIGN KEY ("id_service") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_id_facture_fkey" FOREIGN KEY ("id_facture") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
