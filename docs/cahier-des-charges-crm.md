# Cahier des charges — CRM Signa pour Les Frères Barbiers

> **Statut** : Brouillon v1 — 2026-06-13
> **Client** : Les Frères Barbiers (barbershop, Saint-Sauveur, QC)
> **Intégrateur** : Signa
> **Référence produit** : `CRM-Signa.pdf` (documentation fonctionnelle Signa)

---

## 1. Contexte et objectifs

Les Frères Barbiers dispose déjà d'une **landing page** (Vite + React 19 + TypeScript +
Tailwind v4) présentant les services, tarifs, horaires et un formulaire de réservation
**actuellement factice** (le modal envoie une demande sans persistance).

L'objectif est d'implanter le **CRM Signa** en activant **3 modules** pour permettre :

1. La **gestion des clients** du salon ;
2. La **gestion des services** (catalogue, prix, durées) — déjà affichés sur la landing ;
3. La **gestion des rendez-vous** via un agenda, avec **réservation en ligne depuis la
   landing page**, en respectant les heures d'ouverture du commerce.

Le tout repose sur une base de données **Supabase** (nouveau projet cloud à créer) et une
**console d'administration** accessible sur `/admin`.

### Secteur d'activité
**Barbier** — secteur compatible avec tous les modules retenus (cf. doc Signa, module Services).

---

## 2. Périmètre

### 2.1 Modules retenus (dans le périmètre)

| Module | Statut Signa | Rôle dans ce projet |
|--------|-------------|---------------------|
| **Services** | Obligatoire pour Agenda | Catalogue des prestations réservables + affichage landing |
| **Clients** | Recommandé / composant central | Fiches clients, historique des rendez-vous |
| **Agenda** | Optionnel | Gestion des RDV, disponibilités, réservation en ligne |
| **Barbiers** | Ajout (support Agenda) | Gestion des barbiers et de leurs agendas |

Dépendances (cf. doc Signa) : **Agenda → Services** (obligatoire) et **Agenda → Clients**
(recommandé). Les deux dépendances sont satisfaites puisque les 3 modules sont activés.

### 2.2 Module Barbiers *(décision client)*

Le client gère **plusieurs barbiers**. La doc Agenda associe chaque rendez-vous à un
**Employé** ; un **module Barbiers** dédié est donc créé comme support de l'Agenda, chaque
barbier disposant de son propre agenda et de ses disponibilités.

> **Donnée initiale (seed)** : un barbier par défaut nommé **« Admin »** est créé au
> démarrage. Les autres barbiers seront ajoutés ensuite via le module.

### 2.3 Hors périmètre (modules Signa non activés)

- **Leads** — *bien que marqué « Obligatoire » dans la doc Signa*, le client ne l'a pas
  retenu. La réservation en ligne créera donc directement un **rendez-vous + client**
  plutôt qu'un lead. À réévaluer si le client veut un suivi des demandes non converties.
- **Facturation**
- **Paiements électroniques**
- **Portail client**, **Contrats**, **Support**

Ces modules pourront être activés ultérieurement ; le modèle de données est conçu pour les
accueillir (le module Clients reste le composant central, conformément à la doc Signa).

---

## 3. Acteurs

| Acteur | Accès | Description |
|--------|-------|-------------|
| **Administrateur / Barbier** | `/admin` (authentifié) | Gère clients, services, agenda, paramètres. Identifiant initial : `info@les-freres-barbiers.com` |
| **Client final** | Landing page (public) | Consulte les services et réserve un rendez-vous en ligne |
| **Visiteur** | Landing page (public) | Consulte le site |

---

## 4. Architecture technique

### 4.1 Stack existante (conservée)

- **Frontend** : Vite 8, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Build** : `tsc -b && vite build` ; lint ESLint flat config.
- **Entrée** : `index.html` → `src/main.tsx` → `<App />`.

### 4.2 Ajouts prévus

| Brique | Choix | Notes |
|--------|-------|-------|
| **Base de données / Auth** | **Supabase** (nouveau projet cloud) | Postgres + Supabase Auth + RLS |
| **CLI Supabase** | v2.105.0 (déjà installée) | `supabase init`, migrations versionnées dans `supabase/migrations/` |
| **Client JS** | `@supabase/supabase-js` | À installer |
| **Routing** | Routeur (ex. `react-router`) | Séparer landing publique (`/`) et console (`/admin/*`) |
| **Logique sensible** | Edge Functions / RPC Postgres | Création de réservation en ligne validée côté serveur |

### 4.3 Découpage des routes

```
/                     Landing page publique (existante, à brancher sur les données réelles)
/admin/login          Connexion administrateur (Supabase Auth, email + mot de passe)
/admin                Tableau de bord (redirige vers l'agenda)
/admin/agenda         Module Agenda (vue Semaine par défaut)
/admin/clients        Module Clients
/admin/services       Module Services
/admin/barbiers       Module Barbiers
/admin/parametres     Paramètres (heures d'ouverture, congés, mode de réservation, notifications)
```

Toutes les routes `/admin/*` (sauf `/admin/login`) sont protégées par authentification.

### 4.4 Configuration & secrets

- Variables d'environnement Vite : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (fichier `.env.local`, **non commité**).
- Clé `service_role` **jamais** exposée au frontend — uniquement côté Edge Functions.
- `supabase/config.toml` versionné ; secrets via `.env` ignorés par git.

---

## 5. Modèle de données (Supabase / Postgres)

Schéma proposé (à affiner lors de l'implémentation, migrations versionnées) :

### `services`
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| category | text | Ex. Adultes, Enfants, Barbe, Combo |
| name | text | Ex. « Coupe classique » |
| description | text | |
| price_cents | int | Prix en cents (évite les flottants) |
| duration_min | int | Durée de la prestation |
| prep_min | int | Temps de préparation (défaut 0) |
| cleanup_min | int | Temps de nettoyage (défaut 0) |
| is_active | bool | Affiché / réservable |
| display_order | int | Ordre d'affichage |

### `clients`
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| first_name | text | |
| last_name | text | |
| phone | text | |
| email | text | |
| notes | text | Notes internes |
| created_at | timestamptz | |

### `barbers` (barbiers)
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| name | text | |
| color | text | Couleur d'affichage dans l'agenda |
| is_active | bool | |

> **Seed initial** : un barbier **« Admin »** (`is_active = true`).

### `appointments`
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| client_id | uuid FK → clients | nullable (RDV sans fiche) |
| service_id | uuid FK → services | |
| barber_id | uuid FK → barbers | |
| starts_at | timestamptz | |
| ends_at | timestamptz | Calculé selon la durée du service |
| status | enum | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| source | enum | `online` (landing) / `internal` (saisie admin) |
| notes | text | Notes internes |
| created_at | timestamptz | |

### `business_hours` (heures d'ouverture du salon)
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| weekday | int (0–6) | 0 = lundi |
| open_time | time | nullable si fermé |
| close_time | time | nullable si fermé |
| is_closed | bool | |

> Valeurs initiales (issues de la landing actuelle) :
> Lundi **fermé** · Mardi 10h00–17h00 · Mercredi 10h00–17h00 · Jeudi 10h00–20h00 ·
> Vendredi 10h00–20h00 · Samedi 09h00–16h00 · Dimanche **fermé**.
>
> *Les pauses repas ne sont pas configurées pour le moment (le client les ajoutera plus
> tard) — le schéma les prévoit néanmoins (table `breaks` ou colonnes optionnelles).*

### `closures` (congés spéciaux / fermetures ponctuelles)
| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid PK | |
| date | date | Jour fermé |
| reason | text | |
| barber_id | uuid FK → barbers | nullable (null = tout le salon) |

### `settings` (paramètres globaux)
| clé | valeur | Notes |
|-----|--------|-------|
| `online_booking_mode` | `request` \| `auto` | **Mode de réservation en ligne configurable** (cf. §7.4) |
| `notify_email_enabled` | bool | Notifications par **email** (option, cf. §7.5) |
| `notify_sms_enabled` | bool | Notifications par **SMS** (option, cf. §7.5) |
| ... | | Extensible |

---

## 6. Spécifications par module

### 6.1 Module Services
- CRUD complet des services (catégorie, nom, description, prix, durée, prép., nettoyage,
  disponibilité, ordre).
- **Pré-remplissage** à partir des tarifs déjà présents sur la landing :

  | Catégorie | Service | Prix |
  |-----------|---------|------|
  | Adultes | Coupe classique | 30 $ |
  | Adultes | Coupe stylée | 35 $ |
  | Enfants | Coupe classique | 20 $ |
  | Enfants | Coupe stylée | 25 $ |
  | 65 ans et + | Coupe | 25 $ |
  | Barbe | Taille au clipper | 10 $ |
  | Barbe | Taille à la lame | 15 $ |
  | Combo | Cheveux + Barbe | 40 $ |
  | Rasage | Rasage à la lame | 15 $ |

  > **Durée** : tous les services sont réglés à **60 minutes** pour le lancement
  > (`duration_min = 60`). Ajustable service par service plus tard.
- Les services actifs **alimentent la landing page** (remplacent les données en dur de
  `src/App.tsx`) et la **réservation en ligne**.

### 6.2 Module Clients
- Création / édition de fiches clients (coordonnées, notes internes).
- **Fiche client** : historique des rendez-vous. (Historique factures/paiements : prévu
  par le schéma mais hors périmètre tant que ces modules ne sont pas activés.)
- Recherche et filtrage.

### 6.3 Module Agenda
Conformément à la doc Signa :
- **Vue par défaut : Semaine** ; bascule **Jour / Semaine / Mois** (coin supérieur droit).
- **Création de RDV** : clic sur une plage horaire → fenêtre de création
  (Client, Service, Employé, Date, Heure, Notes). Surbrillance au survol.
- **Consultation de RDV** : fenêtre détaillée (Client, Téléphone, Service, Durée, Prix,
  Notes, Historique) + actions Fermer (X) / Modifier (crayon).
- **Glisser-déposer** : déplacer un RDV (changement d'heure / de jour) avec **validation
  automatique** (disponibilité, heures d'ouverture, conflits).
- **Gestion des disponibilités** : un agenda **par barbier**.
- **Blocage automatique** des périodes fermées (heures de fermeture, jours fermés, congés)
  — applicable **aux barbiers ET aux clients réservant en ligne**.

### 6.4 Module Barbiers
- CRUD des barbiers (nom, couleur d'agenda, actif/inactif).
- **Seed initial** : un barbier **« Admin »** créé au démarrage.
- Chaque barbier possède son propre agenda ; les RDV et congés peuvent lui être rattachés.

### 6.5 Paramètres
- Édition des heures d'ouverture par jour, des jours fermés et des congés spéciaux.
- **Mode de réservation en ligne** (voir §7.4).
- **Notifications** email / SMS (voir §7.5).
- Pauses repas : interface prévue mais désactivée pour le lancement.

---

## 7. Réservation en ligne (landing → CRM)

### 7.1 Parcours client (doc Signa)
1. Le client sélectionne un **service** ;
2. Le système affiche les **disponibilités** (créneaux réels, hors fermetures/congés/RDV existants) ;
3. Le client choisit une **plage horaire** (et éventuellement un barbier) ;
4. Le rendez-vous est **créé** dans le CRM.

### 7.2 Remplacement du modal actuel
Le modal de `src/App.tsx` (services et créneaux **codés en dur**, soumission factice) sera
rebranché sur les **services réels** et les **créneaux réellement disponibles** issus de
Supabase.

### 7.3 Sécurité de la création en ligne
La création d'un RDV depuis le public passe par une **Edge Function / RPC** qui valide
côté serveur : heures d'ouverture, congés, conflits, créneau encore libre — afin de ne pas
exposer d'écriture directe sur la table `appointments`.

### 7.4 Mode de réservation configurable *(décision client)*
Le comportement est **réglable dans les paramètres de l'agenda** via `settings.online_booking_mode` :

- **`request` (demande à confirmer)** : le RDV est créé en statut `pending` et apparaît
  dans le CRM en attente ; le salon confirme (cohérent avec le message actuel du modal
  « nous vous confirmerons par téléphone »).
- **`auto` (confirmation automatique)** : le créneau est réservé immédiatement en statut
  `confirmed` et bloqué dans l'agenda (cf. doc Signa « le rendez-vous est créé
  automatiquement »).

### 7.5 Notifications *(décision client — en option)*
Notifications **activables indépendamment** dans les paramètres
(`notify_email_enabled`, `notify_sms_enabled`) :

- **Email** : confirmation / accusé de demande au client et alerte au salon.
- **SMS** : confirmation / rappel au client.

Les deux canaux sont **optionnels** et désactivés par défaut. L'envoi est réalisé côté
serveur (Edge Function) ; le **fournisseur d'envoi** (email : Resend / SMTP… ; SMS :
Twilio…) reste à choisir au moment de l'implémentation de la Phase 5.

---

## 8. Authentification et sécurité

- **Supabase Auth** (email + mot de passe). Compte administrateur initial :
  `info@les-freres-barbiers.com` (mot de passe à définir au déploiement).
- `/admin/login` : formulaire de connexion ; sessions gérées par Supabase.
- **RLS (Row Level Security)** activé sur toutes les tables :
  - Lecture publique limitée aux **services actifs** et aux **créneaux disponibles** ;
  - Écriture sur `clients`, `appointments` (internes), `services`, `employees`,
    `business_hours`, `closures`, `settings` réservée aux **utilisateurs authentifiés** ;
  - Création de RDV en ligne via Edge Function utilisant une logique contrôlée.
- Secrets hors du dépôt (`.env.local`, `service_role` côté serveur uniquement).

---

## 9. Plan de livraison proposé (phases)

1. **Phase 0 — Socle**
   - `supabase init`, création du projet cloud, `supabase link`.
   - Installer `@supabase/supabase-js` + routeur ; client Supabase ; `.env.local`.
   - Migrations initiales (tables §5) + RLS + données de seed (services, horaires, barbiers).
2. **Phase 1 — Console admin & Auth**
   - `/admin/login`, garde d'authentification, layout `/admin`.
3. **Phase 2 — Module Services**
   - CRUD + seed des tarifs ; brancher la landing sur les services réels.
4. **Phase 3 — Module Clients**
   - CRUD + fiche client + historique RDV.
5. **Phase 4 — Module Agenda**
   - Vues Jour/Semaine/Mois, création/consultation, glisser-déposer, blocage des fermetures.
   - Paramètres d'ouverture + gestion des employés.
6. **Phase 5 — Réservation en ligne**
   - Edge Function de disponibilités + création ; rebrancher le modal ; mode `request`/`auto`.
7. **Phase 6 — Recette & déploiement**
   - Tests bout-en-bout, vérification `npm run build`, mise en production.

---

## 10. Décisions client & questions restantes

### Décisions tranchées (2026-06-13)
- ✅ **Durée des prestations** : **60 min** pour tous les services au lancement.
- ✅ **Barbiers** : module dédié, **un barbier « Admin » par défaut**.
- ✅ **Notifications** : email **et** SMS, les deux **en option** (désactivés par défaut).
- ✅ **Supabase** : nouveau projet cloud.
- ✅ **Login admin** : `info@les-freres-barbiers.com`.
- ✅ **Réservation en ligne** : mode `request`/`auto` configurable dans les paramètres.

### Questions encore ouvertes
1. **Granularité des créneaux** de réservation en ligne (ex. pas de 15 / 30 / 60 min ?).
2. **Délai minimum** avant réservation (ex. pas de RDV à moins de 2 h) et **horizon**
   maximum (ex. réservable jusqu'à 60 jours).
3. **Heures d'ouverture : globales au salon ou par barbier ?** (V1 proposée : globales.)
4. **Fournisseurs d'envoi** des notifications (email : Resend/SMTP… ; SMS : Twilio…) — à
   choisir en Phase 5.
5. **Module Leads** : confirmer qu'on ne le veut pas, malgré son statut « obligatoire »
   dans la doc Signa (sinon les demandes en ligne transiteraient par Leads avant conversion).
6. **Politique d'annulation / modification** par le client en ligne (V1 : non prévue).

---

*Document de cadrage initial — à valider par le client avant le démarrage de
l'implémentation (Phase 0).*
