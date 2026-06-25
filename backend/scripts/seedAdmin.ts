import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'a@gmail.com';
  const passwordPlain = '12345678';

  // Hachage du mot de passe (ne jamais stocker de mots de passe en clair !)
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Utilisation de upsert pour créer l'utilisateur s'il n'existe pas, ou l'ignorer s'il existe déjà
  const adminUser = await prisma.utilisateur.upsert({
    where: { username },
    update: {
      // Si l'utilisateur existe déjà, on met à jour son mot de passe au cas où
      password: passwordHash,
    },
    create: {
      nom: 'Administrateur Gérant',
      telephone: '0000000000',
      adresse: 'Siège Pressing Gloria',
      role: 'gerant', // Le rôle admin correspond au 'gerant' dans notre schéma
      username: username,
      password: passwordHash,
    },
  });

  console.log(`✅ Utilisateur admin créé avec succès !`);
  console.log(`Identifiant : ${adminUser.username}`);
  console.log(`Rôle : ${adminUser.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création de l\'utilisateur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
