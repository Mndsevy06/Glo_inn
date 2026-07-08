import prisma from '../src/config/db';

async function main() {
  console.log("Fetching services...");
  const services = await prisma.service.findMany();
  
  for (const service of services) {
    let price = Number(service.tarif_unitaire);
    let expressPrice = service.tarif_express ? Number(service.tarif_express) : null;
    
    let updated = false;

    // Reduce price if it's 80000 or more
    while (price >= 80000) {
      price = price / 10;
      updated = true;
    }

    // Reduce express price if it exists and is 80000 or more
    if (expressPrice) {
      while (expressPrice >= 80000) {
        expressPrice = expressPrice / 10;
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
