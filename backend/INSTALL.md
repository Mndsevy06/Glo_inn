# Installation du backend

Ce guide suppose que tous les environnements (Node.js, PostgreSQL) sont déjà installés sur la machine.

## 1. Récupérer le code depuis GitHub

```bash
git clone https://github.com/Mndsevy06/Glo_inn.git
cd Glo_inn/backend
```

Si le dépôt est déjà cloné, mettez simplement la branche à jour :

```bash
git pull origin fts-dev
```

## 2. Configurer les variables d'environnement

Créez (ou vérifiez) le fichier `.env` à la racine de `backend/` avec au minimum :

```env
DATABASE_URL=postgres://<utilisateur>:<mot_de_passe>@localhost:5432/<nom_db>
JWT_SECRET=...
NETIKASH_CLIENT_ID=...
NETIKASH_CLIENT_SECRET=...
NETIKASH_WEBHOOK_SIGNING_KEY=...
# ... autres variables requises (voir .env existant)
```

## 3. Installer les dépendances

```bash
npm install
```

## 4. Appliquer les migrations de base de données

```bash
npx prisma migrate deploy
```

Cette commande applique toutes les migrations présentes dans `prisma/migrations/` sur la base PostgreSQL configurée dans `DATABASE_URL`.

Générer ensuite le client Prisma (normalement fait automatiquement après `npm install` via le hook `postinstall` de Prisma, sinon exécuter manuellement) :

```bash
npx prisma generate
```

## 5. Peupler la base de données (scripts de population)

Créer le compte administrateur par défaut :

```bash
npx tsx scripts/seedAdmin.ts
```

Peupler le catalogue de services (idempotent, peut être relancé sans dupliquer les données) :

```bash
npx tsx scripts/seedServices.ts
```

## 6. Lancer l'application

En développement (rechargement automatique) :

```bash
npm run dev
```

En production :

```bash
npm run build
npm start
```

Le serveur démarre par défaut selon la configuration de `src/server.ts` (voir `.env` pour le port).
