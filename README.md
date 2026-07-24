# GnExpress — Frontend

Interface web de la plateforme GnExpress, la super-app guinéenne regroupant livraison de repas, courses au marché, boutiques numériques, géolocalisation, notifications et messagerie.

> Un guide fonctionnel complet — comment tester chaque fonctionnalité, dans quel ordre — se trouve dans [`user_guide.md`](./user_guide.md).

## Stack technique

- **Next.js** 16 (App Router, Turbopack)
- **React** 19 + **TypeScript** 6
- **Tailwind CSS** 4
- **Axios** — requêtes HTTP avec refresh JWT automatique
- **Leaflet** + **react-leaflet** — cartes et géolocalisation (OpenStreetMap, aucune clé API requise)
- **React Hot Toast** — notifications visuelles
- **Lucide React** — icônes
- **js-cookie** — gestion des tokens en cookie
- **Vitest** + **React Testing Library** — tests unitaires/composants

## Structure du projet

```
equipegnfe/
└── src/
    ├── app/                        → Pages (Next.js App Router)
    │   ├── page.tsx                → Accueil
    │   ├── auth/
    │   │   ├── login/              → Connexion (+ accès rapide comptes de test)
    │   │   ├── register/           → Inscription
    │   │   └── forgot-password/    → Mot de passe oublié (code OTP)
    │   ├── compte/                 → Mon compte : changement d'email (code OTP)
    │   ├── delivery/                → Module livraison (restaurants + commande)
    │   ├── marche/                 → Module Mon Marché (courses)
    │   ├── boutiques/              → Module marketplace (boutiques + produits)
    │   └── dashboard/
    │       ├── admin/              → Utilisateurs, stats, codes promo
    │       ├── client/             → Historique commandes, suivi, chat, recommander
    │       ├── livreur/            → Livraisons disponibles/en cours, diffusion GPS
    │       ├── restaurant/         → Commandes, menu, emplacement GPS
    │       ├── boutique/           → Commandes, produits, emplacement GPS
    │       └── coursier/           → Demandes de courses, offres, missions
    ├── components/
    │   ├── layout/                 → Navbar (+ NotificationBell), Footer
    │   ├── checkout/                → AddressSelector (avec pin GPS), PromoCodeField,
    │   │                              PaymentMethodSelector, PaymentStep (OTP Mobile Money)
    │   ├── map/                     → MapPicker (pose un repère), LocationMap (lecture seule)
    │   ├── tracking/                → OrderTrackingPanel (position live du livreur)
    │   ├── chat/                     → ChatPanel (messagerie par commande)
    │   ├── ui/                      → Button, Card, Input, Badge, StatCard
    │   └── Providers.tsx            → AuthProvider global
    ├── context/
    │   ├── AuthContext.tsx          → État d'authentification global (login/logout réactif)
    │   └── CityContext.tsx          → Ville sélectionnée (filtre les listings)
    ├── hooks/
    │   ├── usePolling.ts / useInterval.ts  → Auto-rafraîchissement (dashboards, notifications, chat)
    │   └── useLivreurBroadcast.ts   → Diffusion de la position GPS du livreur
    ├── lib/
    │   ├── api.ts                   → Client Axios + tous les endpoints API
    │   ├── auth.ts                  → Helpers tokens, localStorage, rôles
    │   ├── reorder.ts               → Handoff sessionStorage pour la recommande rapide
    │   ├── leafletIcons.ts          → Fix des icônes Leaflet + centre par défaut (Conakry)
    │   └── utils.ts                 → formatCurrency, formatDate, classes de statut...
    └── types/
        └── index.ts                → Interfaces TypeScript (User, Order, Product, etc.)
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

- Node.js 20+
- npm
- Le **backend doit tourner** sur `http://localhost:8000` (voir le README du dépôt `equipegnbe`)

### 2. Installer les dépendances

```bash
git clone <url-du-repo> equipegnfe
cd equipegnfe

npm install
```

### 3. Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

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

## Tests

```bash
npm test
```

Exécute la suite Vitest (hooks, composants, pages) en mode headless avec jsdom. Les composants Leaflet sont mockés au niveau module (jsdom ne peut pas rendre de vraie carte) ; le rendu réel des cartes se vérifie manuellement dans le navigateur.

## Vérifications

```bash
npx tsc --noEmit   # Typage
npm run lint       # ESLint
npm run build      # Build de production (échoue si TypeScript/ESLint échoue aussi)
```

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

Ces comptes sont accessibles directement depuis la page de connexion via les boutons d'accès rapide. Le backend (`seed_data`) crée un second compte par rôle métier, utile pour tester des interactions à deux (ex. deux restaurants, deux livreurs).

Pour la liste complète des fonctionnalités et comment les tester une à une, voir **[`user_guide.md`](./user_guide.md)**.

---

## Authentification

Le système utilise des **JWT** (access token + refresh token) :

- Les tokens sont stockés en **cookie** (`js-cookie`)
- L'utilisateur est mis en cache dans le **localStorage**
- Un `AuthContext` global gère l'état de connexion — la Navbar se met à jour instantanément sans rechargement de page
- Le client Axios intercepte automatiquement les erreurs 401 et rafraîchit le token
- Mot de passe oublié et changement d'email passent par un code OTP à 4 chiffres **simulé** : aucun email n'est réellement envoyé, le code est affiché directement à l'écran (encadré orange) pour permettre de tester le flux de bout en bout

---

## Build de production

```bash
npm run build
npm start
```
