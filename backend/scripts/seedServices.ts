/**
 * Script: seedServices.ts
 * Peuple la base avec tous les services du tarif Pressing Gloria.
 * - Prix stockés en CDF (tarif USD × taux_echange 2800)
 * - Images Unsplash fiables et cohérentes avec chaque service
 * - Idempotent : ignore les services déjà existants (par libellé)
 * Usage: npx tsx scripts/seedServices.ts
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Taux de change : 1 USD = 2800 CDF (synchronisé avec la config de l'application)
const RATE = 2800;
const usd = (price: number) => Math.round(price * RATE);

// ─── Images par catégorie (URLs directes Unsplash, stables) ──────────────────
const IMG = {
  // Vêtements Homme
  chemise:      'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=600&q=80&fit=crop',
  pantalon:     'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&fit=crop',
  costume:      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop',
  polo:         'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80&fit=crop',
  singlet:      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&fit=crop',
  training:     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop',
  pyjama:       'https://images.unsplash.com/photo-1631824979059-14c0d3f29f02?w=600&q=80&fit=crop',
  cravate:      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80&fit=crop',
  gilet:        'https://images.unsplash.com/photo-1585657781334-c3e2e5a7a6e4?w=600&q=80&fit=crop',
  // Vêtements Femme
  robe:         'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80&fit=crop',
  robe_soiree:  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&fit=crop',
  robe_mariage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop',
  jupe:         'https://images.unsplash.com/photo-1583496661160-fb5218d15e2b?w=600&q=80&fit=crop',
  blouse:       'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80&fit=crop',
  tailleur:     'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&fit=crop',
  echarpe:      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80&fit=crop',
  // Vêtements Enfant
  enfant:       'https://images.unsplash.com/photo-1543051932-6ef9fecfff6a?w=600&q=80&fit=crop',
  // Manteaux & Vestes
  manteau:      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80&fit=crop',
  veste:        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&fit=crop',
  jacket:       'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&fit=crop',
  jacket_cuir:  'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&q=80&fit=crop',
  // Tenues Traditionnelles
  basin:        'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80&fit=crop',
  pagne:        'https://images.unsplash.com/photo-1576868872650-20f5af77cdfe?w=600&q=80&fit=crop',
  safari:       'https://images.unsplash.com/photo-1529391409740-59f2ca0ce0b7?w=600&q=80&fit=crop',
  // Linge de Maison
  drap:         'https://images.unsplash.com/photo-1583394293214-5e6e5e4a70c4?w=600&q=80&fit=crop',
  couverture:   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop',
  duvet:        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80&fit=crop',
  serviette:    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&q=80&fit=crop',
  // Rideaux & Nappes
  rideau:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',
  nappe:        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop',
  // Tapis & Meubles
  tapis:        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop',
  salon:        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop',
  nounours:     'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&q=80&fit=crop',
  ketch:        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop',
  // Réparations
  reparation:   'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=600&q=80&fit=crop',
};

// ─── Données des services (prix en USD → convertis en CDF) ───────────────────
const services = [
  // ── Vêtements Homme ────────────────────────────────────────────────────────
  { libelle: 'CHEMISE',                categorie: 'Vêtements Homme',   tarif: usd(3.50),  image: IMG.chemise },
  { libelle: 'CHEMISE BASIN',          categorie: 'Vêtements Homme',   tarif: usd(3.10),  image: IMG.basin },
  { libelle: 'COSTUME (2 PIECES)',     categorie: 'Vêtements Homme',   tarif: usd(5.17),  image: IMG.costume },
  { libelle: 'COSTUME (3 PIECES)',     categorie: 'Vêtements Homme',   tarif: usd(5.68),  image: IMG.costume },
  { libelle: 'PANTALON',              categorie: 'Vêtements Homme',   tarif: usd(2.60),  image: IMG.pantalon },
  { libelle: 'POLO LACOSTE',          categorie: 'Vêtements Homme',   tarif: usd(3.00),  image: IMG.polo },
  { libelle: 'POLO SIMPLE',           categorie: 'Vêtements Homme',   tarif: usd(2.00),  image: IMG.polo },
  { libelle: 'PULL OVER',             categorie: 'Vêtements Homme',   tarif: usd(2.50),  image: IMG.polo },
  { libelle: 'SINGLET',               categorie: 'Vêtements Homme',   tarif: usd(1.50),  image: IMG.singlet },
  { libelle: 'TRAINING',              categorie: 'Vêtements Homme',   tarif: usd(6.00),  image: IMG.training },
  { libelle: 'GILET',                 categorie: 'Vêtements Homme',   tarif: usd(2.10),  image: IMG.gilet },
  { libelle: 'CRAVATE',               categorie: 'Vêtements Homme',   tarif: usd(1.30),  image: IMG.cravate },
  { libelle: 'PYJAMA',                categorie: 'Vêtements Homme',   tarif: usd(3.50),  image: IMG.pyjama },
  { libelle: 'SOUS VETEMENT',         categorie: 'Vêtements Homme',   tarif: usd(3.50),  image: IMG.singlet },
  { libelle: 'CAUSSETTES',            categorie: 'Vêtements Homme',   tarif: usd(1.55),  image: IMG.singlet },
  { libelle: 'DEMI SAFARI',           categorie: 'Vêtements Homme',   tarif: usd(3.00),  image: IMG.safari },
  { libelle: 'SAFARI',                categorie: 'Vêtements Homme',   tarif: usd(4.00),  image: IMG.safari },

  // ── Vêtements Femme ────────────────────────────────────────────────────────
  { libelle: 'BLOUSE',                categorie: 'Vêtements Femme',   tarif: usd(2.25),  image: IMG.blouse },
  { libelle: 'ROBE SIMPLE',           categorie: 'Vêtements Femme',   tarif: usd(5.00),  image: IMG.robe },
  { libelle: 'ROBE SOIREE',           categorie: 'Vêtements Femme',   tarif: usd(7.00),  image: IMG.robe_soiree },
  { libelle: 'ROBE BAZIN',            categorie: 'Vêtements Femme',   tarif: usd(8.00),  image: IMG.basin },
  { libelle: 'ROBE DE NUIT',          categorie: 'Vêtements Femme',   tarif: usd(3.50),  image: IMG.pyjama },
  { libelle: 'ROBE DE MARIAGE LONGUE TRAINE', categorie: 'Vêtements Femme', tarif: usd(16.00), image: IMG.robe_mariage },
  { libelle: 'ROBE DE MARIAGE SANS TRAINE',   categorie: 'Vêtements Femme', tarif: usd(13.00), image: IMG.robe_mariage },
  { libelle: 'JUPE',                  categorie: 'Vêtements Femme',   tarif: usd(2.60),  image: IMG.jupe },
  { libelle: 'CULOTTE',               categorie: 'Vêtements Femme',   tarif: usd(2.10),  image: IMG.jupe },
  { libelle: 'TAILLEUR',              categorie: 'Vêtements Femme',   tarif: usd(9.00),  image: IMG.tailleur },
  { libelle: 'ECHARPE',               categorie: 'Vêtements Femme',   tarif: usd(2.10),  image: IMG.echarpe },

  // ── Tenues Traditionnelles ─────────────────────────────────────────────────
  { libelle: 'ENSEMBLE BASIN',             categorie: 'Tenues Traditionnelles', tarif: usd(7.00),  image: IMG.basin },
  { libelle: 'ENSEMBLE BASIN 3 PIECES',    categorie: 'Tenues Traditionnelles', tarif: usd(8.50),  image: IMG.basin },
  { libelle: 'ENSEMBLE DAME (2 PIECES)',   categorie: 'Tenues Traditionnelles', tarif: usd(6.00),  image: IMG.pagne },
  { libelle: 'ENSEMBLE DAME (3 PIECES)',   categorie: 'Tenues Traditionnelles', tarif: usd(7.50),  image: IMG.pagne },
  { libelle: 'ENSEMBLE HOMME',            categorie: 'Tenues Traditionnelles', tarif: usd(6.00),  image: IMG.basin },
  { libelle: 'ENSEMBLE PAGNE (2 PIECES)', categorie: 'Tenues Traditionnelles', tarif: usd(6.00),  image: IMG.pagne },
  { libelle: 'ENSEMBLE PAGNE (3 PIECES)', categorie: 'Tenues Traditionnelles', tarif: usd(7.50),  image: IMG.pagne },
  { libelle: 'PAGNE SIMPLE',             categorie: 'Tenues Traditionnelles', tarif: usd(2.60),  image: IMG.pagne },

  // ── Vêtements Enfant ───────────────────────────────────────────────────────
  { libelle: 'CHEMISE ENFANT',             categorie: 'Vêtements Enfant', tarif: usd(1.55), image: IMG.enfant },
  { libelle: 'COSTUME ENFANT (2 PIECES)',  categorie: 'Vêtements Enfant', tarif: usd(3.10), image: IMG.enfant },
  { libelle: 'COSTUME ENFANT (3 PIECES)',  categorie: 'Vêtements Enfant', tarif: usd(3.61), image: IMG.enfant },
  { libelle: 'ENSEMBLE ENFANT (3 PIECES)', categorie: 'Vêtements Enfant', tarif: usd(6.00), image: IMG.enfant },
  { libelle: 'ROBE ENFANT',               categorie: 'Vêtements Enfant', tarif: usd(3.25), image: IMG.enfant },
  { libelle: 'VESTE ENFANT',              categorie: 'Vêtements Enfant', tarif: usd(3.00), image: IMG.enfant },
  { libelle: 'PANTALON ENFANT',           categorie: 'Vêtements Enfant', tarif: usd(2.50), image: IMG.enfant },

  // ── Manteaux & Vestes ──────────────────────────────────────────────────────
  { libelle: 'MANTEAU',       categorie: 'Manteaux & Vestes', tarif: usd(10.00), image: IMG.manteau },
  { libelle: 'VESTE SIMPLE',  categorie: 'Manteaux & Vestes', tarif: usd(3.75),  image: IMG.veste },
  { libelle: 'JACKET SIMPLE', categorie: 'Manteaux & Vestes', tarif: usd(4.13),  image: IMG.jacket },
  { libelle: 'JACKET CUIR',   categorie: 'Manteaux & Vestes', tarif: usd(6.20),  image: IMG.jacket_cuir },

  // ── Linge de Maison ────────────────────────────────────────────────────────
  { libelle: 'DRAP',          categorie: 'Linge de Maison', tarif: usd(7.00),  image: IMG.drap },
  { libelle: 'DRA SIMPLE',    categorie: 'Linge de Maison', tarif: usd(7.00),  image: IMG.drap },
  { libelle: 'DRAP COMPLET',  categorie: 'Linge de Maison', tarif: usd(12.50), image: IMG.drap },
  { libelle: 'TAIE D\'OREILLER', categorie: 'Linge de Maison', tarif: usd(1.50), image: IMG.serviette },
  { libelle: 'COUVERTURE DOUBLE', categorie: 'Linge de Maison', tarif: usd(13.00), image: IMG.couverture },
  { libelle: 'COUVERTURE SIMPLE', categorie: 'Linge de Maison', tarif: usd(10.32), image: IMG.couverture },
  { libelle: 'DUVET',          categorie: 'Linge de Maison', tarif: usd(7.50),  image: IMG.duvet },
  { libelle: 'CACHE DUVET',    categorie: 'Linge de Maison', tarif: usd(7.75),  image: IMG.duvet },
  { libelle: 'CACHE LIT',      categorie: 'Linge de Maison', tarif: usd(3.72),  image: IMG.drap },
  { libelle: 'CACHE MATELAS',  categorie: 'Linge de Maison', tarif: usd(3.72),  image: IMG.drap },
  { libelle: 'ESSUIE MAIN GRAND', categorie: 'Linge de Maison', tarif: usd(4.00), image: IMG.serviette },
  { libelle: 'ESSUIE MAIN PETIT', categorie: 'Linge de Maison', tarif: usd(2.00), image: IMG.serviette },
  { libelle: 'ESSUIE PIED',    categorie: 'Linge de Maison', tarif: usd(2.00),  image: IMG.serviette },
  { libelle: 'GANT',           categorie: 'Linge de Maison', tarif: usd(2.00),  image: IMG.serviette },

  // ── Rideaux & Nappes ───────────────────────────────────────────────────────
  { libelle: 'RIDEAU SIMPLE',        categorie: 'Rideaux & Nappes', tarif: usd(7.50),  image: IMG.rideau },
  { libelle: 'RIDEAU DOUBLE',        categorie: 'Rideaux & Nappes', tarif: usd(10.00), image: IMG.rideau },
  { libelle: 'NAPPE GRANDE',         categorie: 'Rideaux & Nappes', tarif: usd(5.00),  image: IMG.nappe },
  { libelle: 'NAPPE PETITE',         categorie: 'Rideaux & Nappes', tarif: usd(3.50),  image: IMG.nappe },
  { libelle: 'NAPPE DOUBLE / SERVICE', categorie: 'Rideaux & Nappes', tarif: usd(5.00), image: IMG.nappe },
  { libelle: 'NAPPE CONFERENCE',     categorie: 'Rideaux & Nappes', tarif: usd(6.00),  image: IMG.nappe },
  { libelle: 'NAPPERON',             categorie: 'Rideaux & Nappes', tarif: usd(1.50),  image: IMG.nappe },
  { libelle: 'BANDE DECORE',         categorie: 'Rideaux & Nappes', tarif: usd(6.20),  image: IMG.rideau },

  // ── Tapis & Meubles ────────────────────────────────────────────────────────
  { libelle: 'TAPIS 1M',     categorie: 'Tapis & Meubles', tarif: usd(9.00),   image: IMG.tapis },
  { libelle: 'TAUGE',        categorie: 'Tapis & Meubles', tarif: usd(12.50),  image: IMG.tapis },
  { libelle: 'KETCH',        categorie: 'Tapis & Meubles', tarif: usd(12.50),  image: IMG.ketch },
  { libelle: 'SALON COMPLET', categorie: 'Tapis & Meubles', tarif: usd(250.00), image: IMG.salon },
  { libelle: 'SALON SIMPLE',  categorie: 'Tapis & Meubles', tarif: usd(186.00), image: IMG.salon },
  { libelle: 'NOUNOURS GRAND', categorie: 'Tapis & Meubles', tarif: usd(5.17), image: IMG.nounours },
  { libelle: 'NOUNOURS PETIT', categorie: 'Tapis & Meubles', tarif: usd(2.60), image: IMG.nounours },

  // ── Réparations ────────────────────────────────────────────────────────────
  { libelle: 'REP BLOUSE',                       categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP CHEMISE',                      categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP CHEMISE BAZIN',               categorie: 'Réparations', tarif: usd(3.00),  image: IMG.reparation },
  { libelle: 'REP CHEMISE ENFANT',              categorie: 'Réparations', tarif: usd(1.75),  image: IMG.reparation },
  { libelle: 'REP COSTUME (2 PIECES)',          categorie: 'Réparations', tarif: usd(3.75),  image: IMG.reparation },
  { libelle: 'REP COSTUME (3 PIECES)',          categorie: 'Réparations', tarif: usd(4.50),  image: IMG.reparation },
  { libelle: 'REP COSTUME ENFANT (2 PIECES)',   categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
  { libelle: 'REP COSTUME ENFANT (3 PIECES)',   categorie: 'Réparations', tarif: usd(3.10),  image: IMG.reparation },
  { libelle: 'REP CULOTTE',                      categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP DEMI SAFARI',                  categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
  { libelle: 'REP DRAP',                         categorie: 'Réparations', tarif: usd(3.10),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE',                     categorie: 'Réparations', tarif: usd(3.75),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE BAZIN',              categorie: 'Réparations', tarif: usd(4.50),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE DAME (2 PIECES)',    categorie: 'Réparations', tarif: usd(3.75),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE DAME (3 PIECES)',    categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE ENFANT (3 PIECES)',  categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
  { libelle: 'REP ENSEMBLE PAGNE',              categorie: 'Réparations', tarif: usd(4.50),  image: IMG.reparation },
  { libelle: 'REP ESSUIE',                       categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP JUPE',                         categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP PANTALON',                     categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP PANTALON ENFANT',             categorie: 'Réparations', tarif: usd(1.50),  image: IMG.reparation },
  { libelle: 'REP PULL OVER',                    categorie: 'Réparations', tarif: usd(2.00),  image: IMG.reparation },
  { libelle: 'REP RIDEAU',                       categorie: 'Réparations', tarif: usd(4.00),  image: IMG.reparation },
  { libelle: 'REP ROBE BAZIN',                  categorie: 'Réparations', tarif: usd(3.10),  image: IMG.reparation },
  { libelle: 'REP ROBE DE MARIAGE LONG TRAINE', categorie: 'Réparations', tarif: usd(12.50), image: IMG.reparation },
  { libelle: 'REP ROBE DE MARIAGE SANS TRAINE', categorie: 'Réparations', tarif: usd(10.00), image: IMG.reparation },
  { libelle: 'REP ROBE SIMPLE',                 categorie: 'Réparations', tarif: usd(3.10),  image: IMG.reparation },
  { libelle: 'REP ROBE SOIREE',                 categorie: 'Réparations', tarif: usd(7.50),  image: IMG.reparation },
  { libelle: 'REP SAFARI',                       categorie: 'Réparations', tarif: usd(3.10),  image: IMG.reparation },
  { libelle: 'REP SINGLET',                      categorie: 'Réparations', tarif: usd(1.50),  image: IMG.reparation },
  { libelle: 'REP SOUS VETEMENT',               categorie: 'Réparations', tarif: usd(1.50),  image: IMG.reparation },
  { libelle: 'REP VESTE ENFANT',                categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
  { libelle: 'REP VESTE SIMPLE',                categorie: 'Réparations', tarif: usd(2.50),  image: IMG.reparation },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌱 Démarrage du seeding des services (taux: 1 USD = ${RATE} CDF)...\n`);
  let created = 0;
  let skipped = 0;

  for (const svc of services) {
    const existing = await prisma.service.findFirst({ where: { libelle: svc.libelle } });

    if (existing) {
      console.log(`⏭️  Ignoré : ${svc.libelle}`);
      skipped++;
      continue;
    }

    await prisma.service.create({
      data: {
        libelle: svc.libelle,
        description: `Pressing : ${svc.libelle.charAt(0) + svc.libelle.slice(1).toLowerCase()}.`,
        tarif_unitaire: svc.tarif,
        categorie: svc.categorie,
        image: svc.image,
        actif: true,
        express_disponible: false,
      },
    });

    const usdPrice = (svc.tarif / RATE).toFixed(2);
    console.log(`✅ ${svc.libelle.padEnd(45)} — ${svc.tarif.toLocaleString('fr-FR')} CDF (${usdPrice}$)  [${svc.categorie}]`);
    created++;
  }

  console.log(`\n🎉 Seeding terminé !`);
  console.log(`   ✅ ${created} services créés`);
  console.log(`   ⏭️  ${skipped} services ignorés (déjà existants)`);
  console.log(`   📦 Total : ${services.length} services`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
