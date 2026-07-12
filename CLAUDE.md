# CLAUDE.md — Signa

Ce fichier est lu au début de chaque session. Il définit qui nous sommes, comment on travaille, et les règles à suivre sans exception.

---

## 1. Qui est Signa

Signa est une agence qui développe des logiciels pour augmenter l'efficacité des petites entreprises (salons de barbier, salons de coiffure, et éventuellement d'autres secteurs comme la construction).

Le produit principal : un système de **gestion de rendez-vous en ligne**, avec paiement en ligne, gestion des employés, et CRM léger.

Chaque client reçoit systématiquement une **landing page moderne et professionnelle**, adaptée à son secteur et sa marque. Cette landing page a deux rôles :
1. Prise de rendez-vous en ligne (secteurs services : barbier, coiffure)
2. Génération de leads (secteurs comme la construction)

**Règle d'or** : chaque projet est conçu AVANT de communiquer avec le prospect. Le produit doit être impressionnant dès la première démonstration — c'est notre argument de vente. Aucune section "à moitié faite", aucun placeholder visible, aucun bug visuel toléré dans une démo.

---

## 2. Deux types de projets — savoir dans lequel on est

Chaque client a **deux repos séparés** :

| Repo | Contenu | Objectif |
|---|---|---|
| `[client]-landing` | Landing page publique | Vitrine + prise de RDV / leads |
| `[client]-app` | Système de gestion (agenda, CRM, paiements, employés) | Back-office du client |

**Avant de commencer une tâche, identifie toujours dans quel repo tu es** (vérifie le nom du dossier / du repo git) et applique les règles correspondantes ci-dessous (section 5 ou 6). Ne jamais mélanger les responsabilités des deux repos dans un même commit.

---

## 3. Stack technique (identique pour les deux types de repo)

- **Frontend** : React + Vite + TypeScript
- **Base de données / Auth / Storage** : Supabase
- **Contrôle de version** : chaque repo est synchronisé sur GitHub. Commits fréquents, messages clairs en français, un commit = un changement logique.
- **Style** : Tailwind CSS (sauf indication contraire du client)

Aucune dérogation à cette stack sans qu'on en discute explicitement.

---

## 4. Le système de mémoire (`/memory`)

Pour éviter la perte de cohérence entre les sessions et les tâches, chaque repo contient un dossier `memory/` à la racine avec trois fichiers :

```
Si le dossier et les fichiers n'existe pas, tu dois les créer.

memory/
├── memory.md   → Contexte permanent du projet
├── tasks.md    → Liste des tâches (à faire / en cours / terminées)
└── plans.md    → Plans détaillés des fonctionnalités en cours ou à venir
```

### `memory/memory.md`
Contient le contexte qui ne doit jamais être perdu :
- Nom du client, secteur, ton de marque, couleurs, typographies
- Décisions techniques prises et pourquoi (ex: "on utilise X plutôt que Y parce que...")
- Contraintes spécifiques au client
- Ce qui a été essayé et rejeté (pour ne pas relancer la même idée deux fois)

### `memory/tasks.md`
Liste de tâches à trois statuts : `[ ] à faire`, `[~] en cours`, `[x] terminée`. Chaque tâche terminée garde une courte note de ce qui a été fait.

### `memory/plans.md`
Avant toute tâche non-triviale (nouvelle section, nouvelle fonctionnalité, refonte), on y écrit d'abord le plan : objectif, étapes, fichiers touchés, risques. On implémente seulement après.

### Protocole de mise à jour — OBLIGATOIRE

**Au début de chaque tâche :**
1. Lire `memory/memory.md` en entier
2. Lire `memory/tasks.md` pour voir l'état actuel
3. Si la tâche est non-triviale, écrire ou mettre à jour le plan correspondant dans `memory/plans.md` avant de coder

**À la fin de chaque tâche :**
1. Mettre à jour `memory/tasks.md` (statut + note de complétion)
2. Ajouter à `memory/memory.md` toute décision ou contrainte nouvelle qui devra être connue plus tard
3. Cocher/archiver le plan correspondant dans `memory/plans.md`

Ne jamais considérer une tâche "terminée" tant que ces fichiers ne sont pas à jour. Une tâche non reflétée dans `memory/` est une tâche qui n'existe pas pour la prochaine session.

---

## 5. Règles spécifiques — Landing Page (`[client]-landing`)

### Structure obligatoire, dans cet ordre :
1. **Header** — logo, navigation, CTA de prise de RDV visible
2. **Hero** — proposition de valeur claire en une phrase, sous-titre, CTA principal + CTA secondaire
3. **Services** — offre du client, présentée visuellement (cartes, icônes, photos)
4. **Histoire / À propos** — crédibilité, expérience, ce qui différencie le client
5. **Preuve sociale** — avis clients, chiffres clés (si disponibles)
6. **CTA final** — bandeau dédié, incitation claire à réserver / contacter
7. **Footer** — coordonnées complètes (adresse, téléphone, email, réseaux sociaux), heures d'ouverture, liens internes, mentions légales

### Standard de qualité 2026
- Design distinctif — jamais un template générique reconnaissable. Chaque landing page doit avoir une identité visuelle propre au client (couleurs de marque, typographie choisie, ton).
- Performance : chargement rapide, images optimisées, pas de layout shift
- Responsive mobile-first réel (pas juste un rétrécissement du desktop)
- Micro-interactions subtiles (hover states, transitions douces) — sans excès, jamais au détriment de la lisibilité
- Accessibilité de base : contraste suffisant, alt text sur les images, navigation clavier fonctionnelle
- Le formulaire / bouton de prise de RDV doit être visible sans scroll (dans le hero) et répété au moins une fois plus bas dans la page

### Avant de livrer une landing page à un prospect
- Vérifier chaque section sur mobile et desktop
- Vérifier qu'aucun texte "lorem ipsum" ou placeholder ne subsiste
- Vérifier que le CTA de réservation fonctionne réellement (ou pointe vers le bon endroit)

---

## 6. Règles spécifiques — Système de gestion (`[client]-app`)

Couvre : agenda / prise de rendez-vous, paiement en ligne, gestion des employés, CRM léger.

- Priorité à la fiabilité des données (agenda, paiements) avant l'esthétique — mais l'interface doit rester professionnelle, car le client (propriétaire du salon) l'utilise au quotidien
- Toute logique touchant aux paiements doit être testée avant d'être considérée terminée — jamais de code de paiement non vérifié
- Les permissions employé / propriétaire doivent être respectées à chaque fonctionnalité (un employé ne voit pas ce qu'un propriétaire voit)
- Supabase : utiliser Row Level Security (RLS) sur toutes les tables contenant des données client ou des rendez-vous — jamais de table ouverte sans policy définie
- Toujours documenter dans `memory/memory.md` la structure des tables Supabase quand elle change

---

## 7. Règles générales — les deux repos

- Ne jamais halluciner une fonctionnalité ou une donnée client non confirmée — demander plutôt que de supposer
- Ne jamais pousser sur `main` sans que le travail soit fonctionnel (pas de commit qui casse le build)
- Toujours vérifier `memory/tasks.md` avant de proposer une nouvelle tâche, pour éviter de refaire un travail déjà fait ou déjà rejeté
- En cas de doute entre deux approches techniques, documenter le choix et la raison dans `memory/memory.md`, pas seulement dans un commentaire de code

---

## 8. Architecture technique de CE repo (`les-freres-barbiers`)

> Repo **`[client]-app`** de Signa. Particularité : il héberge **à la fois** la landing publique de réservation (`/`) **et** la console d'administration (`/admin/*`) dans une seule app React/Vite. Pas de repo `-landing` séparé pour ce client.

### Commandes

| Action | Commande |
|---|---|
| Dev (HMR) | `npm run dev` — Vite sur le port **3001** |
| Build prod | `npm run build` — `tsc -b && vite build` → `dist/` |
| Lint | `npm run lint` — ESLint (flat config, `eslint.config.js`) |
| Aperçu du build | `npm run preview` |
| Prod (serveur) | PM2 via `ecosystem.config.cjs` — sert `dist/` en SPA sur le port **3041** |

Aucun framework de test installé. Le typecheck se fait via `tsc -b` (intégré au build). Il n'existe pas de commande pour lancer « un seul test ».

### Stack précise
React 19 · Vite 8 · TypeScript 6 · **Tailwind v4** (plugin `@tailwindcss/vite`, **CSS-first — pas de `tailwind.config.js`**) · react-router-dom v7 · `@supabase/supabase-js` v2.

### Configuration requise
`.env.local` (non versionné) doit définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` — sans quoi `src/lib/supabase.ts` lève une erreur au démarrage.

### Carte du code
- **`src/App.tsx`** — landing publique complète (nav, hero, services, tarifs, contact, footer) + modal de réservation. Services/barbiers/tarifs sont chargés depuis Supabase, pas codés en dur.
- **`src/lib/*`** — **couche d'accès aux données** : un module par domaine (`services`, `clients`, `barbers`, `appointments`, `booking`, `businessHours`, `settings`), chacun étant un mince wrapper typé autour du client Supabase. **Tout accès à la base passe par là** — ne pas appeler `supabase` directement depuis un composant.
- `src/lib/supabase.ts` — le singleton client (une seule instance).
- `src/lib/datetime.ts` — helpers date/heure **en heure locale**, semaine **lundi = 0**. Utiliser ceux-là plutôt que de manipuler les `Date` à la main.
- `src/admin/` — console : `AdminLayout` (coquille), `pages/*` (Agenda, Clients, Services, Barbiers, Parametres), `agenda/*` (grille semaine/jour, vue mois, modal de RDV).
- `src/auth/` — `AuthProvider` (session Supabase), `ProtectedRoute`, `RequireAdmin`.

### Modèle d'authz à deux couches (à respecter systématiquement)
1. **UI** : `AuthProvider` → `ProtectedRoute` (exige une session) → `AdminLayout` (charge le barbier + son rôle, force le changement de mot de passe temporaire) → `RequireAdmin` (modules **admin seulement** : Services, Barbiers). Le rôle circule via le **contexte d'`Outlet`** de react-router (`useAdminContext()`), pas par un contexte React global.
2. **Base (RLS)** : la vérité de sécurité. Les policies utilisent `current_barber_role()` — un **barbier** ne voit que **ses** clients/rendez-vous, un **admin** voit tout. Ne jamais se reposer sur la seule couche UI.

Les deux couches doivent rester cohérentes : ajouter un module admin ⇒ le protéger **et** dans `RequireAdmin`/`modules[].adminOnly` **et** dans les policies RLS.

### Réservation publique = RPC `SECURITY DEFINER`
Le rôle `anon` **ne peut pas** écrire dans `appointments`/`clients`. La landing passe par deux RPC validées côté serveur : `available_slots(...)` (créneaux libres) et `book_appointment(...)` (crée client + RDV). Le mode (`request` = à confirmer / `auto` = confirmé direct) vient de la table `settings`. La validation de créneau existe **en double** : `validateSlot()` dans `lib/appointments.ts` (côté client, pour l'agenda admin) **et** dans la RPC (côté serveur) — garder les deux en phase.

### Base de données (Supabase)
- Schéma = migrations ordonnées dans **`supabase/migrations/`** ; c'est la source de vérité. Toute évolution passe par une nouvelle migration (jamais de modif à la main non versionnée), puis mise à jour de `memory/memory.md` (cf. règle §6).
- RPC admin `SECURITY DEFINER` : `admin_create_barber`, `admin_create_account_for_barber`, `admin_set_barber_password`, `admin_set_barber_role`, `current_barber_role`, `clear_my_password_change_flag`.
- Tables : `services`, `barbers` (avec `role`, `user_id` → `auth.users`, `must_change_password`), `clients` (`barber_id`), `appointments` (statuts dont `paid` ; `is_block` pour les plages bloquées), `business_hours`, `closures`, `settings`.
- **Argent** : toujours stocké en **cents (integer)**. Affichage via `formatPrice()` (format québécois : `30 $`, `10,50 $`).

### Thème & styles
Mode clair/sombre piloté par la classe `.dark` sur `<html>` (`lib/theme.ts`, persistée en `localStorage`). Les couleurs passent par des **tokens sémantiques** (`bg`, `fg`, `muted`, `accent`, `border`…) définis dans `src/index.css` (`@theme inline` + variant `.dark`), avec des classes composant `.ui-*` (`ui-card`, `ui-input`, `ui-btn-primary`). Utiliser ces tokens/classes plutôt que des couleurs Tailwind brutes, pour rester cohérent en clair **et** en sombre.
