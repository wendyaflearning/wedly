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
- Utiliser localStorage pour des données sensibles (tokens, session, PII)
  - Exception documentée (WED-160) : queue de pins / demandes de contact pré-inscription
    → données non sensibles (IDs de photo + type d'action), TTL 30 jours, purgée à
    l'inscription (US8) ou à la connexion (US9)
- Modifier globals.css sans vérifier la compatibilité Tailwind v4
- Committer .env.local

## Design & Intégration

### Règle fondamentale
Chaque nouvel écran doit être basé sur le HTML exporté depuis Claude Design.
Ne jamais inventer le layout — toujours demander le HTML de référence avant d'implémenter.

### Workflow d'intégration
1. Récupérer le HTML exporté depuis Claude Design
2. L'inclure dans le prompt comme source de vérité visuelle
3. Adapter en JSX/Tailwind en respectant les conventions ci-dessous

### Conventions de style
- **Tailwind en priorité** — `className` pour tout ce qui est statique
- **`style={{}}`** uniquement pour : valeurs dynamiques, `clamp()`, calculs JS
- **Jamais de couleur hardcodée** — toujours les classes Tailwind du design system ou `var(--color-xxx)`
- **Opacités** via les modificateurs Tailwind : `bordeaux/25`, `bordeaux/44`...

### Route Handlers obligatoires
Tout fetch depuis un Client Component passe par une Route Handler Next.js :
`apps/web/app/api/[resource]/route.ts` → proxy vers Symfony
Jamais d'appel direct au backend depuis le navigateur.

### Scope MVP strict
Ne jamais implémenter un élément de maquette acté comme dette V2.
Si un élément est absent du ticket, il n'existe pas.