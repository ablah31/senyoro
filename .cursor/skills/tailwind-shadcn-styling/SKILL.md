---
name: tailwind-shadcn-styling
description: Tailwind CSS and Shadcn UI styling patterns for this project. Use when styling components, pages, or creating new UI elements. Covers Tailwind utilities, Shadcn components, responsive design, and project-specific design tokens.
metadata:
  author: grandes-marques
  version: "1.0.0"
---

# Tailwind CSS & Shadcn UI Styling - Grandes Marques

Guide de styling avec Tailwind CSS et Shadcn UI pour ce projet.

## Configuration Tailwind

### Couleurs brand

```tsx
// Utiliser les couleurs brand définies dans tailwind.config.js
className = "text-brand-600 bg-brand-100 hover:bg-brand-700";
```

Couleurs disponibles:

- `brand-50` à `brand-900`
- `brand-500` (#b99669) - couleur principale
- `brand-600` (#a57d4f) - hover/active

### Typographie

```tsx
// Serif pour titres
className = "font-serif text-4xl font-semibold";

// Sans-serif pour body
className = "font-sans text-base";
```

Polices:

- Serif: `Cormorant Garamond`
- Sans: `Poppins`

## Composants Shadcn UI

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="border-slate-200 shadow-sm transition-all hover:shadow-xl">
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>Contenu</CardContent>
</Card>;
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="outline" className="text-sm">
  Nouveau
</Badge>;
```

### Separator

```tsx
import { Separator } from "@/components/ui/separator";

<Separator className="my-8" />;
```

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">
  Cliquer
</Button>

<Button variant="ghost" className="group">
  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
</Button>
```

## Patterns de layout

### Container

```tsx
// Utiliser la classe container (définie dans globals.css)
<div className="container py-12 md:py-16 lg:py-20">{/* Contenu */}</div>
```

### Grilles responsive

```tsx
// Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 3 colonnes
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

### Flexbox

```tsx
// Header avec espacement
<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
  <h1>Titre</h1>
  <Button>Action</Button>
</div>
```

## Animations avec Framer Motion

### Animation de base

```tsx
"use client";
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Contenu
</motion.div>;
```

### Stagger animations

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## Styles pour contenu HTML (prose)

### Utiliser les classes prose

```tsx
// Pour le contenu HTML provenant de Strapi
<div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

Classes disponibles:

- `prose` - styles de base
- `prose-lg` - taille plus grande
- `prose-slate` - couleur slate (déprécié, utiliser `prose` seul)

## Images

### Aspect ratio

```tsx
<div className="relative aspect-[16/9] overflow-hidden rounded-xl">
  <Image src={url} alt={alt} fill className="object-cover" />
</div>
```

### Images avec hover

```tsx
<div className="group relative aspect-[4/3] overflow-hidden bg-slate-100">
  <Image
    src={url}
    alt={alt}
    fill
    className="object-cover transition-transform duration-700 group-hover:scale-110"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
</div>
```

## États interactifs

### Hover states

```tsx
<Link href="/" className="group block">
  <Card className="transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl">
    <h3 className="group-hover:text-brand-600 transition-colors">Titre</h3>
  </Card>
</Link>
```

### Focus states

```tsx
<button className="focus-visible:ring-brand-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
  Bouton
</button>
```

## Responsive design

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### Mobile-first

```tsx
// Commencer par mobile, puis ajouter les breakpoints
className = "text-base md:text-lg lg:text-xl";
className = "py-8 md:py-12 lg:py-16";
className = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
```

## Espacements

### Padding/Margin

```tsx
// Padding vertical responsive
className = "py-12 md:py-16 lg:py-20";

// Margin bottom
className = "mb-8 md:mb-12";

// Gap dans les grilles
className = "gap-6 md:gap-8";
```

## Couleurs du projet

### Slate (texte)

```tsx
className = "text-slate-900"; // Titres
className = "text-slate-600"; // Body
className = "text-slate-500"; // Secondary
className = "bg-slate-50"; // Backgrounds légers
```

### Brand (accents)

```tsx
className = "text-brand-600"; // Liens, accents
className = "bg-brand-100"; // Backgrounds
className = "border-brand-300"; // Bordures
```

## Utilitaires

### cn() pour classes conditionnelles

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // prop optionnel
)}>
```

### Line clamp

```tsx
className = "line-clamp-2"; // Limite à 2 lignes
className = "line-clamp-3"; // Limite à 3 lignes
```

## Best practices

1. **Mobile-first**: Commencer par mobile, puis ajouter les breakpoints
2. **Utiliser les composants Shadcn** plutôt que de créer des composants custom
3. **Classes utilitaires Tailwind** plutôt que CSS custom
4. **Animations avec Framer Motion** pour les interactions complexes
5. **Classes prose** pour le contenu HTML de Strapi
6. **Couleurs brand** pour les accents et interactions
