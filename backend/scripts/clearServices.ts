/**
 * Script: clearServices.ts
 * Supprime tous les services de la base de données.
 * Les services liés à des commandes sont d'abord désactivés (contrainte FK RESTRICT).
 * Usage: npx tsx scripts/clearServices.ts
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️  Démarrage de la suppression de tous les services...\n');

  const allServices = await prisma.service.findMany({ select: { id: true, libelle: true } });
  console.log(`📦 ${allServices.length} services trouvés.\n`);

  let deleted = 0;
  let deactivated = 0;

  for (const svc of allServices) {
    const usageCount = await prisma.ligneCommande.count({ where: { id_service: svc.id } });

    if (usageCount > 0) {
      // Service utilisé dans des commandes → désactiver uniquement
      await prisma.service.update({ where: { id: svc.id }, data: { actif: false } });
      console.log(`⚠️  Désactivé (utilisé dans ${usageCount} commande(s)) : ${svc.libelle}`);
      deactivated++;
    } else {
      // Service non utilisé → supprimer
      await prisma.service.delete({ where: { id: svc.id } });
      console.log(`✅ Supprimé : ${svc.libelle}`);
      deleted++;
    }
  }

  console.log(`\n🏁 Nettoyage terminé !`);
  console.log(`   🗑️  ${deleted} services supprimés`);
  console.log(`   ⚠️  ${deactivated} services désactivés (référencés dans des commandes)`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
