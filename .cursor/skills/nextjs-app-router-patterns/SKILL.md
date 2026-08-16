---
name: nextjs-app-router-patterns
description: Next.js 15 App Router patterns and best practices for this project. Use when building pages, layouts, server components, client components, or API routes. Covers Server Components, Client Components, data fetching, routing, and project-specific conventions.
metadata:
  author: grandes-marques
  version: "1.0.0"
---

# Next.js App Router Patterns - Grandes Marques

Guide des patterns et conventions pour le développement avec Next.js 15 App Router dans ce projet.

## Architecture Générale

### Server Components par défaut

- **Par défaut**: Tous les composants sont Server Components (RSC)
- **Client Components**: Uniquement si nécessaire (`'use client'`)
  - Interactivité (onClick, onChange, etc.)
  - Hooks React (useState, useEffect, etc.)
  - Événements navigateurs
  - Context API

### Structure des fichiers

```
app/
├── layout.tsx              # Layout racine (Server Component)
├── page.tsx                # Page d'accueil (Server Component)
├── [cmsSlug]/             # Route dynamique CMS
│   └── page.tsx
├── blog/
│   └── page.tsx            # Page blog (Server Component)
└── api/                    # API Routes
    └── graphql/
        └── route.ts
```

## Patterns de Pages

### Page Server Component

```tsx
import { Metadata } from "next";
import { CMSPageService } from "@/lib/services/CMSPageService";

// Métadonnées SEO
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
};

// ISR Configuration
export const dynamicParams = true;
export const revalidate = 3600; // 1 heure

// Server Component par défaut
export default async function Page() {
  // Data fetching côté serveur
  const data = await CMSPageService.getCMSPages();

  return <PageContent data={data} />;
}
```

### Page avec génération statique

```tsx
export async function generateStaticParams() {
  const slugs = await CMSPageService.getAllCMSPageSlugs();
  return slugs.map((slug) => ({ cmsSlug: slug }));
}

export default async function CMSPage({ params }: { params: Promise<{ cmsSlug: string }> }) {
  const { cmsSlug } = await params;
  const pageData = await CMSPageService.getCMSPageBySlug(cmsSlug);

  if (!pageData) {
    notFound();
  }

  return <CMSPage pageData={pageData} />;
}
```

## Data Fetching

### Pattern de service

```tsx
// src/lib/services/CMSPageService.ts
export class CMSPageService {
  static async getCMSPages(): Promise<CMSPagesResult> {
    const result = await stitchedClient.query({
      query: STITCHED_QUERIES.GET_CMS_PAGES,
    });
    return { pages: result.data?.cmsPages?.data || [] };
  }
}
```

### Utilisation dans les pages

```tsx
// ✅ BIEN - Server Component
export default async function Page() {
  const { pages } = await CMSPageService.getCMSPages();
  return <BlogList pages={pages} />;
}

// ❌ MAL - Client Component qui fetch
("use client");
export default function Page() {
  const [pages, setPages] = useState([]);
  useEffect(() => {
    CMSPageService.getCMSPages().then(setPages);
  }, []);
  return <BlogList pages={pages} />;
}
```

### Éliminer les waterfalls

```tsx
// ❌ MAL - Sequential waterfalls
const user = await fetchUser();
const posts = await fetchPosts(user.id);
const comments = await fetchComments(posts[0].id);

// ✅ BIEN - Parallel execution
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);
const comments = await Promise.all(posts.map((post) => fetchComments(post.id)));
```

## Client Components

### Quand utiliser 'use client'

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ✅ Nécessaire pour:
// - useState, useEffect, useCallback
// - Événements onClick, onChange
// - Framer Motion animations
// - Context API

export function InteractiveComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <motion.button onClick={handleClick} whileHover={{ scale: 1.05 }}>
      Count: {count}
    </motion.button>
  );
}
```

### Pattern Server + Client

```tsx
// Server Component (page.tsx)
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// Client Component (ClientComponent.tsx)
("use client");
export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // Logique interactive
  return <div>{/* UI */}</div>;
}
```

## Styling

### Tailwind CSS (priorité)

```tsx
export function Component() {
  return (
    <div className="container py-12 md:py-16 lg:py-20">
      <h1 className="font-serif text-4xl font-semibold text-slate-900 md:text-5xl">Title</h1>
    </div>
  );
}
```

### Shadcn UI Components

```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function Component() {
  return (
    <Card>
      <CardHeader>
        <Badge>New</Badge>
      </CardHeader>
      <CardContent>Content</CardContent>
    </Card>
  );
}
```

### Styled Components (legacy - éviter si possible)

```tsx
// Utiliser uniquement pour composants existants
// Préférer Tailwind pour nouveaux composants
import styled from "styled-components";

const Wrapper = styled.div`
  margin: 50px auto;
  width: 90%;
`;
```

## Images

### Next.js Image avec Strapi

```tsx
import Image from "next/image";
import { buildStrapiImageUrlFromObject } from "@/lib/utils/strapi-image";

export function ImageComponent({ strapiImage }) {
  const imageUrl = buildStrapiImageUrlFromObject(strapiImage, "");
  const imageAlt = strapiImage?.data?.attributes?.alternativeText || "Image";

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1200px"
      />
    </div>
  );
}
```

## Animations

### Framer Motion

```tsx
"use client";
import { motion } from "framer-motion";

export function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      Content
    </motion.div>
  );
}
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

## API Routes

### Route Handler pattern

```tsx
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Logique serveur
  const data = await fetchData(id);

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validation
  // Traitement
  // Réponse

  return NextResponse.json({ success: true });
}
```

## Métadonnées SEO

### generateMetadata

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await CMSPageService.getCMSPageBySlug(slug);

  return {
    title: page?.Seo?.SeoTitle || page?.title,
    description: page?.Seo?.SeoDescription,
    openGraph: {
      title: page?.title,
      description: page?.Seo?.SeoDescription,
      type: "website",
    },
  };
}
```

## Gestion des erreurs

### notFound()

```tsx
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const { slug } = await params;
  const data = await fetchData(slug);

  if (!data) {
    notFound(); // Affiche app/not-found.tsx
  }

  return <PageContent data={data} />;
}
```

### Error boundaries

```tsx
// app/error.tsx
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Performance

### React.cache() pour déduplication

```tsx
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return await db.user.findUnique({ where: { id: session.user.id } });
});

// Dans plusieurs composants, une seule requête
```

### Dynamic imports

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  ssr: false,
  loading: () => <Skeleton />,
});
```

## Conventions du projet

### Naming

- Composants: PascalCase (`BlogList.tsx`)
- Pages: `page.tsx`, `layout.tsx`, `not-found.tsx`
- Services: PascalCase avec suffixe Service (`CMSPageService.ts`)
- Utils: camelCase (`strapi-image.ts`)

### Imports

- Absolute imports avec `@/` alias
- Grouper: React, Next.js, libs externes, composants internes, styles

### Types

- Interfaces pour props de composants
- Types explicites, éviter `any`
- Utiliser `unknown` si nécessaire
