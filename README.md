# Senyoro

Application de gestion d’un centre de lavage en Guinée (GNF, fuseau `Africa/Conakry`). Next.js + Supabase, mobile-first, un seul administrateur.

## Prérequis

- Node.js 20+
- Un projet Supabase (ici `ioymqsmzgmoxqrjhqods`)
- Un compte admin créé **dans le dashboard Auth de Supabase** (pas d’inscription dans l’app). Le trigger `on_auth_user_created` rattache le profil à l’organisation Senyoro.

## Démarrage

```bash
cp .env.example .env.local
npm install
npm run dev
```

Variables attendues dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://ioymqsmzgmoxqrjhqods.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_publiable
```

Ouvrir [http://localhost:3000](http://localhost:3000). Les routes applicatives sont protégées par le middleware.

## Schéma et données

Les migrations versionnées sont dans `supabase/migrations/`. Elles ont été appliquées sur le projet cloud (pas de stack Docker locale).

Seed de démonstration (idempotent) :

- `supabase/seed/demo.sql` — employés, clients, lavages, caisse, dépenses, salaires, objectif
- `supabase/seed/reset_demo.sql` — retire uniquement les données taguées demo

## Parcours principaux

- Tableau de bord (7 KPI, graphiques, objectifs, classement)
- Nouveau lavage, historique, caisse espèces / Mobile Money
- Dépenses, récurrentes, salaires
- Employés, clients, prestations
- Rapports et exports CSV / Excel
- Recherche globale (`⌘K` / `Ctrl+K`)
- Paramètres et journal d’audit

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run format
```
