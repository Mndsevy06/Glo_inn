require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Fetching services...");
  const services = await prisma.service.findMany();
  
  for (const service of services) {
    let price = Number(service.tarif_unitaire);
    let expressPrice = service.tarif_express ? Number(service.tarif_express) : null;
    
    let updated = false;

    if (price > 7000) {
      price = 7000;
      updated = true;
    }

    // Reduce express price if it exists and is 7000 or more
    if (expressPrice) {
      if (expressPrice > 7000) {
        expressPrice = 7000;
        updated = true;
      }
    }

    if (updated) {
      await prisma.service.update({
        where: { id: service.id },
        data: {
          tarif_unitaire: price,
          tarif_express: expressPrice
        }
      });
      console.log(`Updated service ${service.libelle}: ${service.tarif_unitaire} -> ${price}`);
    }
  }
  console.log("All necessary prices have been updated.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
