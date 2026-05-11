<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Wedly — apps/web

## Stack
- Next.js 15, App Router, TypeScript
- Tailwind CSS v4 (config via @theme dans globals.css, pas tailwind.config.ts)
- Fonts : Cormorant Garamond + Manrope via next/font/google

## Commandes
- `npm run dev` — lancer le serveur (port 3000)
- `npm run build` — build production
- `npm run lint` — lint

## Design system
Couleurs (classes Tailwind) :
- bg-creme / text-creme : #FFF6ED (fond principal)
- bg-bordeaux / text-bordeaux : #4E1A32 (couleur signature)
- text-texte : #291A10 (texte principal)
- bg-accent / text-accent : #9D4F1E (CTA, boutons)
- bg-highlight / text-highlight : #E35704 (icônes, séparateurs)
- text-gris : #9E8E85 (textes secondaires)

Fonts :
- font-cormorant : Cormorant Garamond (titres, italic)
- font-manrope : Manrope (corps de texte)
- ⚠️ Dans les Client Components, utiliser style={{ fontFamily: 'var(--font-manrope-var)' }} si la classe Tailwind ne s'applique pas

## Architecture
- Server Components : fetch de données, pas d'interactivité
- Client Components : useState, événements, interactions
- Règle : Server → Client, jamais l'inverse
- Colocalisation : les composants spécifiques à une route vivent dans le dossier de la route

## API
- Base URL : process.env.NEXT_PUBLIC_API_URL
- Toujours { cache: 'no-store' } pour les données d'onboarding
- En dev local : lancer Symfony avec --no-tls

## Assets
- Logo : /logo.png (⚠️ TODO : remplacer par logo.svg quand disponible)
- SVG inline pour les anneaux Wedly

## Conventions
- Nommage composants : PascalCase
- Props typées avec interface TypeScript
- Pas de any
- snake_case pour les clés JSON (shape API)

## ⚠️ Ne jamais faire
- Hardcoder des couleurs en dehors du design system
- Utiliser localStorage (pas supporté dans les artifacts)
- Modifier globals.css sans vérifier la compatibilité Tailwind v4
- Committer .env.local