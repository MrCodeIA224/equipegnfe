# Guide fonctionnel GnExpress

Ce guide décrit, dans l'ordre logique d'un parcours utilisateur, chaque fonctionnalité de GnExpress et les étapes précises pour la tester. Il couvre le frontend et les comportements backend qu'il déclenche.

## Sommaire

0. [Prérequis](#0-prérequis)
1. [Authentification et gestion du compte](#1-authentification-et-gestion-du-compte)
2. [Navigation générale](#2-navigation-générale)
3. [Livraison de repas (Client)](#3-livraison-de-repas-client)
4. [Mon Marché (Client)](#4-mon-marché-client)
5. [Boutiques (Client)](#5-boutiques-client)
6. [Tableau de bord Restaurant](#6-tableau-de-bord-restaurant)
7. [Tableau de bord Boutiquierr](#7-tableau-de-bord-boutiquierr)
8. [Tableau de bord Livreur](#8-tableau-de-bord-livreur)
9. [Tableau de bord Coursier](#9-tableau-de-bord-coursier)
10. [Tableau de bord Admin](#10-tableau-de-bord-admin)
11. [Référence rapide : où tester quoi](#11-référence-rapide--où-tester-quoi)

---

## 0. Prérequis

1. Lancer le backend (voir `README.md` du dépôt `equipegnbe`) :
   ```bash
   python manage.py migrate --database=default
   python manage.py migrate --database=delivery_db
   python manage.py migrate --database=market_db
   python manage.py migrate --database=marketplace_db
   python manage.py seed_data
   python manage.py runserver
   ```
2. Lancer le frontend :
   ```bash
   npm install
   npm run dev
   ```
3. Ouvrir **http://localhost:3000**.

Tous les comptes de test utilisent le mot de passe `GnExpress@2024` et sont accessibles en un clic depuis la page de connexion (section "Accès de test").

---

## 1. Authentification et gestion du compte

### 1.1 Inscription

**Description** : création d'un compte avec choix du rôle métier (Client, Livreur, Restaurant, Boutiquierr, Coursier — le rôle Admin ne peut pas s'auto-attribuer).

**Comment tester** :
1. Aller sur `/auth/register`.
2. Choisir un rôle, remplir prénom/nom/nom d'utilisateur/email/téléphone/mot de passe.
3. Valider → redirection automatique vers le tableau de bord correspondant au rôle choisi.

### 1.2 Connexion / Déconnexion

**Comment tester** :
1. Sur `/auth/login`, saisir un email (ou nom d'utilisateur) + mot de passe, ou cliquer un bouton d'accès rapide (ex. "Client") qui pré-remplit les identifiants de démo.
2. Cliquer "Se connecter" → redirection vers le tableau de bord du rôle.
3. Dans la Navbar, ouvrir le menu du profil (avatar en haut à droite) → "Déconnexion".

### 1.3 Mot de passe oublié

**Description** : réinitialisation par code OTP à 4 chiffres. Aucun email n'est réellement envoyé (pas de serveur SMTP configuré) : le code est affiché directement à l'écran dans un encadré, comme en environnement de démo/sandbox.

**Comment tester** :
1. Depuis `/auth/login`, cliquer "Mot de passe oublié ?" (ou aller directement sur `/auth/forgot-password`).
2. Saisir l'email d'un compte existant (ex. `mamadou@test.gn`) → "Envoyer le code".
3. Le code de démonstration s'affiche dans un encadré orange. Le saisir dans le champ "Code de vérification".
4. Renseigner un nouveau mot de passe (2 fois identiques) → "Réinitialiser le mot de passe".
5. Vérifier la redirection vers `/auth/login`, puis se reconnecter avec le nouveau mot de passe.

**Cas d'erreur à tester** : email inconnu (message d'erreur), code erroné, mots de passe non identiques, mot de passe trop faible (validateurs Django par défaut).

### 1.4 Changer d'adresse email (connecté)

**Description** : nécessite de resaisir l'email actuel (confirmation) puis la nouvelle adresse ; un code OTP est envoyé (simulé) sur la **nouvelle** adresse avant que le changement ne soit appliqué.

**Comment tester** :
1. Être connecté, ouvrir le menu du profil dans la Navbar → "Mon compte" (page `/compte`).
2. Dans "Confirmez votre email actuel", saisir l'email exact du compte connecté.
3. Dans "Nouvelle adresse email", saisir une adresse différente et non utilisée par un autre compte.
4. Cliquer "Envoyer le code de validation" → le code de démonstration s'affiche.
5. Le saisir dans "Code de vérification" → "Valider".
6. Vérifier que l'email affiché en haut de la carte a changé, sans avoir besoin de se reconnecter.

**Cas d'erreur à tester** : email actuel incorrect, nouvelle adresse déjà utilisée par un autre compte, code OTP erroné.

---

## 2. Navigation générale

### 2.1 Sélecteur de ville

**Description** : filtre les restaurants/boutiques affichés par ville (Conakry par défaut).

**Comment tester** : dans la Navbar, ouvrir le sélecteur à côté de l'icône de localisation, changer de ville, constater que la liste des restaurants/boutiques se met à jour sur `/delivery` et `/boutiques`.

### 2.2 Cloche de notifications

**Description** : notifications in-app créées automatiquement à chaque étape clé d'une commande (nouvelle commande reçue par le vendeur, confirmation, livraison, livreur assigné, annulation, offre reçue/acceptée pour Mon Marché...). Le compteur non lu se rafraîchit toutes les 25 secondes.

**Comment tester** :
1. Être connecté avec un compte ayant reçu au moins une notification (ex. après qu'un restaurant confirme une commande passée par ce compte — voir 3.6).
2. Cliquer sur la cloche dans la Navbar → la liste des notifications s'affiche, la plus récente en premier.
3. Cliquer sur une notification non lue (fond légèrement teinté) → elle passe en lu, le compteur diminue.
4. Cliquer "Tout marquer lu" → toutes les notifications passent en lu.

---

## 3. Livraison de repas (Client)

### 3.1 Parcourir les restaurants et le menu

**Comment tester** :
1. Se connecter en Client (ex. `mamadou@test.gn`), aller sur `/delivery`.
2. Utiliser la barre de recherche pour filtrer par nom.
3. Cliquer un restaurant → le menu s'affiche à droite, groupé par catégorie.
4. Si le restaurant a un repère GPS enregistré (voir 6.2), une carte en lecture seule s'affiche sous l'en-tête.

### 3.2 Construire le panier et passer commande

**Comment tester** :
1. Cliquer sur "+" pour ajouter des articles au panier (le bouton "-"/"+" permet d'ajuster les quantités).
2. Cliquer le bouton panier (en haut à droite du menu) → la fenêtre de commande s'ouvre.
3. **Adresse de livraison** : choisir une adresse déjà enregistrée, ou cliquer "Ajouter une nouvelle adresse" pour saisir libellé + adresse + ville, et optionnellement poser un repère sur la mini-carte (voir 3.3).
4. **Code promo** (optionnel, voir 3.4).
5. **Mode de paiement** : "Paiement à la livraison" ou Mobile Money (voir 3.5).
6. Cliquer "Commander" → la commande est créée, une notification est envoyée au restaurant.

### 3.3 Poser un repère GPS sur une adresse

**Comment tester** : lors de l'ajout d'une nouvelle adresse (voir 3.2 étape 3), cliquer directement sur la carte affichée pour y déposer un repère avant d'enregistrer. Le repère est optionnel — l'adresse peut être enregistrée sans coordonnées.

### 3.4 Code promo

**Comment tester** :
1. Dans la fenêtre de commande, saisir un code créé par un admin (voir 10.4) dans le champ "Code promo" → "Appliquer".
2. Vérifier que la réduction s'affiche dans le récapitulatif et que le total est recalculé.
3. Tester un code invalide, expiré, ou en dessous du montant minimum requis → message d'erreur explicite.
4. Tester une seconde utilisation du même code par le même client → rejeté ("déjà utilisé").

### 3.5 Paiement Mobile Money simulé

**Description** : Orange Money et MTN Mobile Money sont simulés (aucune vraie passerelle) : un code de confirmation à 4 chiffres est généré et affiché à l'écran, imitant le SMS qu'un vrai service enverrait.

**Comment tester** :
1. Choisir "Orange Money" ou "MTN Mobile Money" comme mode de paiement, saisir un numéro de téléphone, valider la commande.
2. Une fenêtre de paiement s'ouvre : saisir le numéro (si demandé) → "Envoyer" → le code simulé s'affiche.
3. Saisir ce code → "Confirmer" → le paiement passe en confirmé.
4. Vérifier que tant que le paiement n'est pas confirmé, le restaurant **ne peut pas** accepter la commande (voir 6.3) — message "Paiement non confirmé".
5. Tester un code erroné 3 fois de suite → le paiement passe en échec.

### 3.6 Suivre une commande (tableau de bord Client)

**Comment tester** :
1. Aller sur `/dashboard/client`, onglet "Livraisons".
2. Chaque commande affiche son statut (En attente de confirmation → Confirmée → En préparation → Prête pour livraison → Prise en charge par le livreur → En livraison → Livrée), qui se met à jour automatiquement (polling).
3. Une fois un livreur assigné (statut "Prise en charge par le livreur" ou "En livraison"), deux boutons apparaissent :
   - **"Suivre la livraison"** : affiche la position GPS en direct du livreur (voir 8.3) — actif uniquement pendant "En livraison".
   - **"Chat"** : ouvre la messagerie avec le livreur (voir 3.7).

### 3.7 Chat par commande

**Comment tester** :
1. Depuis une commande avec livreur assigné, cliquer "Chat".
2. Écrire un message → "Envoyer" : il s'affiche aligné à droite.
3. Se connecter avec le compte du livreur assigné (autre onglet/session) et ouvrir le chat sur sa mission en cours (voir 8.4) pour vérifier la réception et répondre.
4. Les messages se synchronisent toutes les 10 secondes des deux côtés.

### 3.8 Recommander une commande passée

**Description** : recrée en un clic le panier d'une commande déjà livrée ou annulée, avec les prix/disponibilité actuels du menu.

**Comment tester** :
1. Sur `/dashboard/client`, repérer une commande au statut "Livrée" ou "Annulée" → bouton "Recommander".
2. Cliquer dessus → redirection vers `/delivery`, le restaurant et le panier se rechargent automatiquement, l'adresse de livraison est pré-remplie, la fenêtre de commande s'ouvre directement.
3. Si un article du menu original n'est plus disponible, un message indique lequel a été ignoré.
4. Ajuster si besoin, puis valider normalement (voir 3.2).

---

## 4. Mon Marché (Client)

### 4.1 Créer une demande de courses

**Comment tester** :
1. Aller sur `/marche`.
2. **Étape 1 - Infos de livraison** : titre, marché cible, adresse (avec repère GPS optionnel comme en 3.3), budget estimé, instructions.
3. **Étape 2 - Liste de courses** : ajouter un ou plusieurs articles (nom + quantité), un code promo optionnel.
4. "Envoyer la demande" → la demande passe en statut "Ouverte", visible par tous les coursiers disponibles.

### 4.2 Recevoir et accepter une offre de coursier

**Comment tester** :
1. Un coursier propose une offre sur la demande (voir 9.1).
2. Sur `/dashboard/client`, onglet "Courses", la demande "Ouverte" affiche les offres reçues (nom du coursier + frais proposés).
3. Cliquer "Accepter" sur une offre → la demande passe en "Assignée" au coursier choisi, les autres offres deviennent caduques.

### 4.3 Suivre la demande jusqu'à la livraison

**Comment tester** : le statut évolue automatiquement au fil des actions du coursier puis du livreur : "Coursier assigné" → "En cours - Courses en train d'être faites" → "Prête - Cherche livreur" (un livreur peut alors être assigné, voir 9.2) → "En livraison" → "Terminée". Comme pour la livraison de repas, "Suivre la livraison" (une fois un livreur assigné et le statut "En livraison") et "Chat" apparaissent sur la carte de la demande.

### 4.4 Recommander une liste de courses

**Comment tester** : sur une demande "Terminée" ou "Annulée", cliquer "Recommander" → redirection vers `/marche` avec le titre, le marché, l'adresse, le budget et tous les articles pré-remplis à l'étape 1. Modifier si besoin puis envoyer normalement.

---

## 5. Boutiques (Client)

### 5.1 Parcourir les boutiques et produits

**Comment tester** :
1. Aller sur `/boutiques`.
2. Filtrer par catégorie, chercher par mot-clé.
3. Cliquer une boutique → ses produits s'affichent ; si un repère GPS existe (voir 7.2), une carte en lecture seule apparaît sous l'en-tête.

### 5.2 Commander (livraison ou retrait)

**Comment tester** :
1. Ajouter des produits au panier, ouvrir la fenêtre de commande.
2. Choisir "Livraison" (adresse requise, comme en 3.2) ou "Retrait en boutique".
3. Choisir le mode de paiement (cash ou Mobile Money simulé, voir 3.5) et valider.

### 5.3 Suivi, chat et recommande rapide

Fonctionnent à l'identique de la livraison de repas (voir 3.6, 3.7) depuis `/dashboard/client`, onglet "Achats" — à l'exception de la recommande rapide, qui n'est proposée que pour les livraisons (restaurant) et Mon Marché.

---

## 6. Tableau de bord Restaurant

Se connecter avec un compte `RESTAURANT` (ex. `resto.madina@test.gn`).

### 6.1 Gérer plusieurs restaurants

Si le compte possède plusieurs restaurants, un sélecteur en haut de `/dashboard/restaurant` permet de basculer de l'un à l'autre. Basculer "Ouvert"/"Fermé" via l'interrupteur sur la carte d'information.

### 6.2 Définir l'emplacement GPS

**Comment tester** :
1. Sur la carte d'information du restaurant, cliquer "Définir l'emplacement" (ou "Modifier l'emplacement" si déjà défini).
2. Cliquer sur la carte pour poser un repère → enregistrement automatique ("Emplacement enregistré").
3. Vérifier que le repère apparaît côté client sur `/delivery` (voir 3.1).

### 6.3 Traiter les commandes

**Comment tester** : sur l'onglet "Commandes", faire progresser chaque commande dans l'ordre : "Confirmer" (bloqué si un paiement Mobile Money n'est pas encore confirmé, voir 3.5) → "En préparation" → "Prête pour livraison". Un livreur peut alors l'accepter (voir 8.1).

### 6.4 Gérer le menu

Onglet "Mon menu" : ajouter/modifier des articles (nom, description, prix, disponibilité, catégorie).

### 6.5 Annulation par le livreur

Si un livreur annule sa prise en charge après l'avoir acceptée (voir 8.5), une alerte rouge apparaît en haut du tableau de bord avec un bouton "Confirmer & Réassigner" qui remet la commande à disposition des livreurs.

---

## 7. Tableau de bord Boutiquierr

Se connecter avec un compte `BOUTIQUIERR` (ex. `boutique.mode@test.gn`). Fonctionne comme le tableau de bord Restaurant (section 6), avec les différences suivantes :

### 7.1 Cycle de statut

"Confirmer" → "En préparation" → "Prêt pour livraison" ou "Prêt pour retrait" selon le mode choisi par le client.

### 7.2 Définir l'emplacement GPS

Identique à 6.2, mais sur l'onglet "Mes produits" : chaque boutique du compte a son propre bouton "Définir l'emplacement".

### 7.3 Gérer les produits

Onglet "Mes produits" : ajouter des produits par boutique (nom, prix, stock).

---

## 8. Tableau de bord Livreur

Se connecter avec un compte `LIVREUR` (ex. `ibrahima.livreur@test.gn`).

### 8.1 Accepter une livraison disponible

**Comment tester** :
1. Onglet "Disponibles" : trois sections possibles — Restaurants (livraison de repas prête), Boutiques (commande boutique prête), Courses à livrer (demande Mon Marché en attente de livreur).
2. Cliquer "Accepter" sur l'une d'elles → elle passe dans l'onglet "Mes livraisons" et disparaît des disponibles pour les autres livreurs (premier arrivé, premier servi — un message d'erreur s'affiche si un autre livreur a été plus rapide).

### 8.2 Livrer une commande

**Comment tester** : dans "Mes livraisons", faire progresser la commande : "Démarrer la livraison" → "Marquer comme livré". Dès "Démarrer la livraison", la diffusion GPS s'active automatiquement (voir 8.3) et un badge "Position partagée avec le client" apparaît sur la carte.

### 8.3 Diffusion de la position GPS

**Description** : pendant qu'une livraison est "En livraison", le navigateur diffuse la position GPS réelle du livreur (`navigator.geolocation.watchPosition`) toutes les 12 secondes.

**Comment tester** :
1. Autoriser la géolocalisation quand le navigateur la demande (nécessite HTTPS ou `localhost`, et un appareil/émulateur avec position GPS disponible).
2. Démarrer une livraison (voir 8.2).
3. Côté client, ouvrir "Suivre la livraison" sur la commande correspondante (voir 3.6) et vérifier que la position affichée se met à jour.

> En environnement de test sans capteur GPS réel, ce flux peut être vérifié au niveau de l'appel API (`POST /api/v1/auth/livreurs/position/`) plutôt qu'avec une position réelle du navigateur.

### 8.4 Chat avec le client

Identique à 3.7, disponible sur toute mission "Prise en charge par le livreur" ou "En livraison" (livraison de repas/boutique) via le bouton "Chat" sur la carte de mission.

### 8.5 Annuler une prise en charge

**Comment tester** : sur une livraison "Prise en charge par le livreur", "Annuler la prise en charge" → la commande passe en attente de confirmation du restaurant/boutique (voir 6.5/7.1), qui doit la remettre à disposition avant qu'un autre livreur puisse la reprendre.

---

## 9. Tableau de bord Coursier

Se connecter avec un compte `COURSIER` (ex. `kouyate.coursier@test.gn`).

### 9.1 Proposer une offre sur une demande de courses

**Comment tester** :
1. Onglet "Demandes" : liste des demandes Mon Marché ouvertes.
2. Cliquer "Faire une offre" sur une demande → saisir un message et des frais proposés → "Envoyer l'offre".
3. La demande passe dans "Mes missions" → "Offres en attente de réponse" jusqu'à la décision du client (voir 4.2).

### 9.2 Effectuer les courses

**Comment tester** : une fois l'offre acceptée, la demande apparaît dans "Mes missions". Faire progresser : "Démarrer les courses" → "Courses terminées". La demande devient alors disponible pour qu'un livreur l'accepte (voir 8.1) pour la livraison finale.

### 9.3 Chat avec le client

Bouton "Chat" disponible sur chaque mission active — identique à 3.7.

---

## 10. Tableau de bord Admin

Se connecter avec le compte `ADMIN` (`admin@gnexpress.gn`).

### 10.1 Vue d'ensemble

Section "Vue d'ensemble" : statistiques agrégées des trois modules (livraison, marché, boutiques).

### 10.2 Gestion des utilisateurs

Section "Utilisateurs" : lister, vérifier/dé-vérifier un compte, activer/désactiver un compte.

### 10.3 Supervision des commandes

Sections "Restaurants", "Commandes Livraison", "Courses Marché", "Boutiques", "Commandes Boutiques" : vue en lecture sur toute l'activité de la plateforme, tous comptes confondus.

### 10.4 Codes promo

**Comment tester** :
1. Section "Codes Promo" → formulaire de création : code, type de réduction (pourcentage ou montant fixe), valeur, montant minimum de commande, limite d'utilisation (optionnelle).
2. Créer le code → il apparaît dans le tableau avec son usage (0 / limite).
3. Le tester côté client au checkout (voir 3.4).
4. Basculer son statut actif/inactif depuis le tableau → vérifier qu'un code inactif est rejeté au checkout.

---

## 11. Référence rapide : où tester quoi

| Fonctionnalité | Rôle(s) | Page(s) |
|---|---|---|
| Inscription / Connexion / Déconnexion | Tous | `/auth/register`, `/auth/login` |
| Mot de passe oublié (OTP) | Tous (déconnecté) | `/auth/forgot-password` |
| Changer d'email (OTP) | Tous (connecté) | `/compte` |
| Notifications in-app | Tous | Cloche dans la Navbar |
| Commander un repas | Client | `/delivery` |
| Demander des courses (Mon Marché) | Client | `/marche` |
| Commander en boutique | Client | `/boutiques` |
| Suivi de commande, chat, position live | Client | `/dashboard/client` |
| Recommande rapide | Client | `/dashboard/client` → bouton "Recommander" |
| Codes promo (utilisation) | Client | Étape paiement de chaque module |
| Paiement Mobile Money simulé | Client | Étape paiement de chaque module |
| Gestion restaurant + emplacement GPS | Restaurant | `/dashboard/restaurant` |
| Gestion boutique + emplacement GPS | Boutiquierr | `/dashboard/boutique` |
| Accepter/livrer + diffusion GPS | Livreur | `/dashboard/livreur` |
| Offres et courses au marché | Coursier | `/dashboard/coursier` |
| Utilisateurs, stats, codes promo (admin) | Admin | `/dashboard/admin` |

Pour l'intégrité référentielle des données cross-service (audit technique, pas une fonctionnalité utilisateur), voir la commande `python manage.py check_referential_integrity` décrite dans le README du backend.
