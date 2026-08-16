# Cursor Skills — Frontend Next.js

Ce dossier contient les skills Cursor utilisées pour améliorer la qualité du code et du design dans
ce projet Next.js. Cursor les détecte automatiquement via le frontmatter `name` / `description` de
chaque `SKILL.md`.

## Skills présentes

| Skill                            | Nom invocable                   | Rôle                                                                |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `vercel-react-best-practices/`   | `vercel-react-best-practices`   | Performance React/Next.js (45 règles priorisées)                    |
| `nextjs-app-router-patterns/`    | `nextjs-app-router-patterns`    | Conventions Next.js 15 App Router du projet                         |
| `tailwind-shadcn-styling/`       | `tailwind-shadcn-styling`       | Styling Tailwind + Shadcn, tokens du projet                         |
| `frontend-design/`               | `frontend-design`               | Direction artistique distinctive, anti-esthétique générique         |
| `using-ui-stack/`                | `using-ui-stack`                | Design system chiffré : grille 8px, 60-30-10, 5 états, a11y         |
| `vercel-react-view-transitions/` | `vercel-react-view-transitions` | View Transition API React (`<ViewTransition>`, `addTransitionType`) |
| `web-design-guidelines/`         | `web-design-guidelines`         | Audit de conformité Web Interface Guidelines                        |

### Détails des skills récemment ajoutées

**`using-ui-stack`** — source : [spencerpauly/awesome-cursor-skills](https://github.com/spencerpauly/awesome-cursor-skills/blob/main/resources/using-ui-stack/SKILL.md).
Impose des valeurs mesurables là où `frontend-design` reste qualitatif : grille d'espacement 8px,
répartition colorimétrique 60-30-10, échelle typographique de ratio 1.25, les 5 états obligatoires
d'un élément interactif (default / hover / active / focus / disabled), seuils de contraste, cibles
tactiles 44×44px, durées d'animation 150–300ms, échelle de z-index.
Une section **« Precedence In This Project »** a été ajoutée en fin de fichier pour arbitrer ses
conflits avec `frontend-design` et le plugin shadcn (tokens sémantiques plutôt que palette
`slate-*`, pas de `z-index` manuel sur les overlays shadcn, typo distinctive prioritaire).

**`vercel-react-view-transitions`** — source : [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions).
Couvre les transitions natives du navigateur sans librairie d'animation tierce : shared elements,
reveals Suspense, identité de liste, enter/exit, transitions de route directionnelles, intégration
App Router (`experimental.viewTransition`, prop `transitionTypes` sur `next/link`) et
`prefers-reduced-motion`. Le dossier a été nommé d'après le `name` du frontmatter
(`vercel-react-view-transitions`) pour rester cohérent avec `vercel-react-best-practices`.

Structure : `SKILL.md` (chargé en premier), `references/` (4 guides chargés à la demande) et
`AGENTS.md` (document complet, toutes références inlinées).

## shadcn/ui : déjà disponible via plugin

La skill officielle de [ui.shadcn.com/docs/skills](https://ui.shadcn.com/docs/skills) **n'est pas
dupliquée ici** : elle est déjà installée globalement comme plugin Cursor (`cursor-public/shadcn`),
avec son serveur MCP. Elle injecte le contexte projet via `shadcn info --json` et fournit
`rules/styling.md`, `rules/forms.md`, `rules/composition.md`, `rules/icons.md`,
`rules/base-vs-radix.md`, `cli.md`, `registry.md`, `customization.md`.

Elle s'active à la détection d'un `components.json`. Ce dépôt n'en contient pas encore : la skill
restera inerte jusqu'à l'initialisation du projet Next.js (`npx shadcn@latest init`).

## Ordre d'utilisation recommandé

### Nouveau composant

1. `nextjs-app-router-patterns` — Server ou Client Component ?
2. `shadcn` (plugin) — un composant existant couvre-t-il le besoin ?
3. `tailwind-shadcn-styling` + `using-ui-stack` — styling et valeurs du design system
4. `vercel-react-best-practices` — performance
5. `frontend-design` — direction esthétique

### Nouvelle page

1. `nextjs-app-router-patterns` — structure et data fetching
2. `frontend-design` — direction artistique avant le code
3. `tailwind-shadcn-styling` + `using-ui-stack` — layout et tokens
4. `vercel-react-view-transitions` — transitions de route et shared elements
5. `web-design-guidelines` — vérification finale

### Optimisation

1. `vercel-react-best-practices` — identifier les problèmes
2. `nextjs-app-router-patterns` — appliquer les patterns
3. `web-design-guidelines` — audit accessibilité et UX

## Arbitrage des conflits

Trois skills se recouvrent sur le styling. En cas de désaccord :

1. **`shadcn` (plugin)** gagne sur les APIs de composants et les tokens sémantiques — ses règles sont
   « always enforced ».
2. **`using-ui-stack`** gagne sur les valeurs chiffrées (espacement, états, contraste, durées).
3. **`frontend-design`** gagne sur les choix créatifs (typographie, palette, composition, signature).

## Skills référencées mais absentes du dossier

Documentées dans une version antérieure de ce README, non présentes dans le dépôt :

- `graphql-schema-stitching` — patterns Schema Stitching unifiant Saleor et Strapi
- `vercel-composition-patterns` — patterns de composition React (éviter la prolifération de props booléennes)

## Structure d'une skill

```
skill-name/
├── SKILL.md          # Documentation principale (frontmatter name + description requis)
├── metadata.json     # Métadonnées (optionnel)
├── README.md         # Documentation détaillée (optionnel)
├── AGENTS.md         # Document compilé (optionnel)
└── references/       # Guides chargés à la demande (optionnel)
```

## Mise à jour des skills upstream

Les skills provenant de dépôts externes se rafraîchissent en réécrasant les fichiers depuis leur
source :

```bash
# frontend-design (anthropics/skills)
curl -fsSL https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md \
  -o .cursor/skills/frontend-design/SKILL.md

# vercel-react-view-transitions (vercel-labs/agent-skills)
BASE=https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-view-transitions
for f in SKILL.md AGENTS.md README.md metadata.json; do
  curl -fsSL "$BASE/$f" -o ".cursor/skills/vercel-react-view-transitions/$f"
done
for f in css-recipes.md implementation.md nextjs.md patterns.md; do
  curl -fsSL "$BASE/references/$f" -o ".cursor/skills/vercel-react-view-transitions/references/$f"
done
```

Attention : `using-ui-stack/SKILL.md` contient une section locale
(« Precedence In This Project ») à réappliquer après toute mise à jour depuis l'upstream.

---

**Dernière mise à jour** : Août 2026
