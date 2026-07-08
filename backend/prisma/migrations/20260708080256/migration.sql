/*
  Warnings:

  - The values [CinetPay] on the enum `ModePaiement` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reference_cinetpay` on the `paiements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[netikash_request_id]` on the table `paiements` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pawapay_deposit_id]` on the table `paiements` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EtatCommande" ADD VALUE 'en_attente';
ALTER TYPE "EtatCommande" ADD VALUE 'retrait_partiel';
ALTER TYPE "EtatCommande" ADD VALUE 'annule';

-- AlterEnum
BEGIN;
CREATE TYPE "ModePaiement_new" AS ENUM ('Cash', 'PawaPay', 'Netikash');
ALTER TABLE "paiements" ALTER COLUMN "mode_paiement" TYPE "ModePaiement_new" USING ("mode_paiement"::text::"ModePaiement_new");
ALTER TYPE "ModePaiement" RENAME TO "ModePaiement_old";
ALTER TYPE "ModePaiement_new" RENAME TO "ModePaiement";
DROP TYPE "public"."ModePaiement_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "commandes" DROP CONSTRAINT "commandes_id_receptionniste_fkey";

-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "client_deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id_receptionniste" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lignes_commande" ADD COLUMN     "quantite_retiree" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "id_commande" UUID;

-- AlterTable
ALTER TABLE "paiements" DROP COLUMN "reference_cinetpay",
ADD COLUMN     "netikash_link" TEXT,
ADD COLUMN     "netikash_request_id" TEXT,
ADD COLUMN     "netikash_status" TEXT,
ADD COLUMN     "netikash_trans" TEXT,
ADD COLUMN     "operateur" TEXT,
ADD COLUMN     "pawapay_deposit_id" TEXT,
ADD COLUMN     "pawapay_status" TEXT,
ADD COLUMN     "telephone_client" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CDF',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light';

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "taux_echange" DECIMAL(10,2) NOT NULL DEFAULT 2800,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" UUID NOT NULL,
    "id_commande" UUID NOT NULL,
    "id_client" UUID NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avis_id_commande_key" ON "avis"("id_commande");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_netikash_request_id_key" ON "paiements"("netikash_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_pawapay_deposit_id_key" ON "paiements"("pawapay_deposit_id");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_id_receptionniste_fkey" FOREIGN KEY ("id_receptionniste") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_commande_fkey" FOREIGN KEY ("id_commande") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
