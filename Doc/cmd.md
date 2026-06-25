# 🚀 Guide d'Installation — Pressing Gloria Inn

> Suivez les étapes dans l'ordre exact. Ce guide couvre l'installation complète sur un nouveau PC.

---

## ✅ PRÉ-REQUIS À INSTALLER MANUELLEMENT

Avant de commencer, installez ces outils sur le nouveau PC :

| Outil | Version | Lien |
|---|---|---|
| **Node.js** | v20 LTS ou + | https://nodejs.org |
| **PostgreSQL** | v15 ou + | https://www.postgresql.org/download/windows/ |
| **Git** | Dernière version | https://git-scm.com |

---

## 📁 ÉTAPE 1 — Récupérer le projet

```bash
# Si le projet est sur GitHub
git clone https://github.com/VOTRE_COMPTE/glo_inn.git
cd glo_inn

# Sinon : copiez le dossier Glo_inn sur le nouveau PC via OneDrive ou clé USB
```

---

## 🗄️ ÉTAPE 2 — Créer la base de données PostgreSQL

```bash
# Ouvrir pgAdmin ou psql et créer la base de données
# Dans psql (terminal PostgreSQL) :
psql -U postgres

# Dans l'invite psql :
CREATE DATABASE glo_in;
\q
```

> ⚠️ Notez le port PostgreSQL (souvent 5432 ou 5433), le nom d'utilisateur et le mot de passe.

---

## ⚙️ ÉTAPE 3 — Configurer les fichiers .env

### Backend — `backend/.env`

```env
PORT=5000
DATABASE_URL=postgres://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/glo_in

JWT_SECRET=super_secret_jwt_key_2026_pressing_gloria

# ─── PawaPay Mobile Money ───────────────────────────────────────────────────
PAWAPAY_ENV=sandbox
PAWAPAY_API_TOKEN=VOTRE_TOKEN_SANDBOX_PAWAPAY
PAWAPAY_WEBHOOK_SECRET=VOTRE_WEBHOOK_SECRET_PAWAPAY

# URL publique du backend (utiliser localhost.run ou ngrok en dev local)
# En production : https://api.pressinggloria.com
BACKEND_PUBLIC_URL=http://localhost:5000
```

### Frontend — `frontend/.env`

```env
VITE_PORT=5173
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5000
VITE_EXCHANGE_RATE=2800
```

---

## 📦 ÉTAPE 4 — Installer les dépendances Backend

```bash
cd backend
npm install
```

---

## 🔄 ÉTAPE 5 — Générer le client Prisma et migrer la base de données

```bash
# Toujours dans le dossier backend/

# Générer le client Prisma (obligatoire après chaque modification du schéma)
npx prisma generate

# Appliquer toutes les migrations à la base de données
npx prisma migrate deploy

# OU (en développement) créer et appliquer une nouvelle migration
npx prisma migrate dev --name init
```

> 💡 Si vous avez une erreur de connexion, vérifiez que PostgreSQL est bien démarré et que `DATABASE_URL` dans `.env` est correct.

---

## 🌱 ÉTAPE 6 — Peupler la base de données (Seed)

```bash
# Toujours dans le dossier backend/
npx prisma db seed
```

> Si une commande seed n'existe pas, les données de base (utilisateurs, services) peuvent être créées via l'interface d'administration.

---

## 📦 ÉTAPE 7 — Installer les dépendances Frontend

```bash
cd ../frontend
npm install --legacy-peer-deps
```

> ⚠️ Le flag `--legacy-peer-deps` est obligatoire à cause de conflits entre versions de Vite et certaines bibliothèques (jspdf, recharts).

---

## ▶️ ÉTAPE 8 — Démarrer l'application

### Terminal 1 — Backend :

```bash
cd backend
npm run dev
```

> ✅ Vous devez voir : `🚀 Serveur démarré sur http://localhost:5000`

### Terminal 2 — Frontend :

```bash
cd frontend
npm run dev -- --force
```

> ✅ Ouvrez votre navigateur sur : `http://localhost:5173`

---

## 🔌 ÉTAPE 9 — Exposer le backend pour les webhooks PawaPay (optionnel en dev)

```bash
# Dans un Terminal 3, toujours dans le dossier backend/
# Cela crée un tunnel public temporaire vers localhost:5000
ssh -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run
```

> Une URL publique sera affichée, ex: `https://abc123.lhr.life`
> Copiez cette URL et mettez-la dans `backend/.env` :
> `BACKEND_PUBLIC_URL=https://abc123.lhr.life`
> Puis ajoutez `/api/payments/webhook` à la fin dans le dashboard PawaPay Sandbox.

---

## 🛠️ COMMANDES UTILES

### Prisma Studio (visualiser la base de données) :
```bash
cd backend
npx prisma studio
# Ouvrir http://localhost:5555
```

### Réinitialiser complètement la base de données :
```bash
cd backend
npx prisma migrate reset
# ⚠️ Supprime TOUTES les données — à utiliser uniquement en développement
```

### Vérifier l'état des migrations :
```bash
cd backend
npx prisma migrate status
```

### Mettre à jour Prisma Client après modification du schéma :
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name NOM_DE_LA_MIGRATION
```

### Build de production Frontend :
```bash
cd frontend
npm run build
```

---

## 🔐 COMPTES PAR DÉFAUT (après seed)

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| **Gérant** | `admin` | `admin123` |
| **Réceptionniste** | `reception` | `123456` |

> ⚠️ Changez ces mots de passe dès la première connexion en production !

---

## 🌐 PORTS UTILISÉS

| Service | Port |
|---|---|
| Backend API | `5000` |
| Frontend Vite | `5173` |
| PostgreSQL | `5432` ou `5433` |
| Prisma Studio | `5555` |

---

## ❗ ERREURS FRÉQUENTES ET SOLUTIONS

### `Cannot find module 'jspdf'`
```bash
cd frontend
npm install jspdf jspdf-autotable --legacy-peer-deps
# Redémarrer avec :
npm run dev -- --force
```

### `Error: P1001 - Can't reach database server`
- Vérifiez que PostgreSQL est démarré (Services Windows)
- Vérifiez le port et le mot de passe dans `DATABASE_URL`

### `PAWAPAY_API_TOKEN non configuré`
- Générez un token sur https://dashboard.sandbox.pawapay.io/ → API Keys
- Collez-le dans `backend/.env`

### Prisma Studio `ERR_STREAM_PREMATURE_CLOSE`
- C'est un faux avertissement, Studio fonctionne quand même
- Ouvrez http://localhost:5555 dans votre navigateur
