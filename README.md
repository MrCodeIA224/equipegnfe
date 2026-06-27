# GnExpress — Frontend

Interface web de la plateforme GnExpress, la super-app guinéenne regroupant livraison de repas, courses au marché et boutiques numériques.

## Stack technique

- **Next.js** 14 (App Router)
- **React** 18 + **TypeScript** 5
- **Tailwind CSS** 3.4
- **Axios** 1.7 — requêtes HTTP avec refresh JWT automatique
- **React Hot Toast** — notifications
- **Lucide React** — icônes
- **js-cookie** — gestion des tokens en cookie

## Structure du projet

```
frontend/
└── src/
    ├── app/                   → Pages (Next.js App Router)
    │   ├── page.tsx           → Accueil
    │   ├── auth/
    │   │   ├── login/         → Connexion
    │   │   └── register/      → Inscription
    │   ├── delivery/          → Module livraison (restaurants + commande)
    │   ├── marche/            → Module marché (courses)
    │   ├── boutiques/         → Module marketplace (boutiques + produits)
    │   └── dashboard/
    │       ├── admin/         → Tableau de bord administrateur
    │       ├── client/        → Tableau de bord client
    │       ├── livreur/       → Tableau de bord livreur
    │       ├── restaurant/    → Tableau de bord restaurant
    │       ├── boutique/      → Tableau de bord boutiquierr
    │       └── coursier/      → Tableau de bord coursier
    ├── components/
    │   ├── layout/            → Navbar, Footer
    │   ├── ui/                → Button, Card, Input, Badge, StatCard
    │   └── Providers.tsx      → AuthProvider global
    ├── context/
    │   └── AuthContext.tsx    → État d'authentification global (login/logout réactif)
    ├── lib/
    │   ├── api.ts             → Client Axios + tous les endpoints API
    │   ├── auth.ts            → Helpers tokens, localStorage, rôles
    │   └── utils.ts           → formatCurrency, formatDate, classes de statut...
    └── types/
        └── index.ts           → Interfaces TypeScript (User, Order, Product, etc.)
```

## Charte graphique

| Usage | Couleur |
|-------|---------|
| Primaire (orange) | `#f97316` |
| Secondaire (vert) | `#16a34a` |
| Accent (rouge) | `#dc2626` |

---

## Démarrage en développement

### 1. Prérequis

- Node.js 18+
- npm ou yarn
- Le **backend doit tourner** sur `http://localhost:8000`

### 2. Installer les dépendances

```bash
git clone <url-du-repo>
cd frontend

npm install
```

### 3. Variables d'environnement

Créer un fichier `.env.local` à la racine du dossier `frontend/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Si cette variable est absente, l'URL par défaut `http://localhost:8000/api/v1` est utilisée automatiquement.

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur **http://localhost:3000**

---

## Comptes de test

Mot de passe universel : `GnExpress@2024`

| Email | Rôle | Dashboard |
|-------|------|-----------|
| admin@gnexpress.gn | ADMIN | /dashboard/admin |
| mamadou@test.gn | CLIENT | /dashboard/client |
| ibrahima.livreur@test.gn | LIVREUR | /dashboard/livreur |
| resto.madina@test.gn | RESTAURANT | /dashboard/restaurant |
| boutique.mode@test.gn | BOUTIQUIERR | /dashboard/boutique |
| kouyate.coursier@test.gn | COURSIER | /dashboard/coursier |

Ces comptes sont accessibles directement depuis la page de connexion via les boutons d'accès rapide.

---

## Authentification

Le système utilise des **JWT** (access token + refresh token) :

- Les tokens sont stockés en **cookie** (`js-cookie`)
- L'utilisateur est mis en cache dans le **localStorage**
- Un `AuthContext` global gère l'état de connexion — la Navbar se met à jour instantanément sans rechargement de page
- Le client Axios intercepte automatiquement les erreurs 401 et rafraîchit le token

---

## Build de production

```bash
npm run build
npm start
```

## Linter

```bash
npm run lint
```
