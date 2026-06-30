# /wedly-review — Revue de PR spécifique Wedly

Analyse le diff de la branche courante (ou d'une PR GitHub) selon les conventions Wedly et les règles de périmètre MVP.

## Usage

```
/wedly-review          ← analyse la branche courante vs develop
/wedly-review <PR#>    ← analyse une PR GitHub
```

---

## Instructions

### Étape 1 — Récupérer le diff

**Depuis un numéro de PR :**
```bash
gh pr diff <PR#>
gh pr view <PR#> --json title,body,files
```

**Depuis la branche courante :**
```bash
git diff develop...HEAD
git diff develop...HEAD --stat
```

### Étape 2 — Appliquer la checklist

Pour chaque constat, attribuer une sévérité :
- 🔴 **Bloquant** — doit être corrigé avant le merge
- 🟠 **Avertissement** — devrait être corrigé, acceptable de merger avec une note
- 🟡 **Dette technique** — non-bloquant, signaler pour information

---

#### Backend (Symfony / PHP)

**Architecture**
- [ ] Les controllers sont Single Action et minces — aucune logique métier à l'intérieur
- [ ] Les DTOs et Assemblers sont des classes séparées — pas de mapping inline dans le controller
- [ ] La logique métier vit dans les services, pas dans les DTOs ni les controllers
- [ ] Les erreurs des services utilisent `DomainException` — pas d'objet `Response` construit dans un service
- [ ] Les erreurs de validation utilisent `ValidationException` (→ 422 via ExceptionListener) — pas de `JsonResponse` manuel

**Strategy Pattern (ADR-004)**
- [ ] Chaque nouveau step handler implémente `StepHandlerInterface` et étend `AbstractOnboardingStepHandler`
- [ ] Le handler est taggé avec `#[AutoconfigureTag]` — jamais instancié manuellement
- [ ] `isFilled(Vendor $vendor): bool` est implémenté — le statut de l'étape n'est PAS dérivé du curseur `onboarding_step`

**API & Sécurité**
- [ ] Les guards d'auth sont en place sur les endpoints, ou explicitement marqués `// TODO auth`
- [ ] Les codes HTTP sont corrects : 400/404/422 pour les erreurs client, pas de 500 génériques

**Base de données & Schéma**
- [ ] Pas de champ ajouté absent de `docs/wedly_schema_v3.mmd`
- [ ] Identifiants SQL en snake_case, classes PHP en PascalCase
- [ ] Les valeurs monétaires utilisent des centimes entiers (ex. `price_cents`) — jamais de floats
- [ ] Toutes les nouvelles entités utilisent `TimestampableTrait`
- [ ] Les clés primaires sont des UUID v7
- [ ] Les relations ManyToMany utilisent des tables de jointure explicites — jamais gérées silencieusement par Doctrine
- [ ] Les nouvelles migrations respectent l'ordre de dépendance des entités (Wave 1 → 2 → 3)
- [ ] Les nouvelles colonnes FK ont un index correspondant dans la migration

**Performance**
- [ ] Pas de requêtes N+1 — vérifier les appels `findBy` ou repository dans des boucles

**Style de code**
- [ ] Les paramètres de closures utilisent des noms explicites : `fn($service)` pas `fn($s)`

**Tests** *(non-bloquant — dette technique)*
- [ ] Les nouveaux services ou logiques métier ont un test correspondant dans `tests/Unit/`
  - Si absent : signaler en 🟡 dette technique, pas bloquant

---

#### Frontend (Next.js / TypeScript)

**Architecture Wedly**
- [ ] Les Server Components appellent directement les fonctions `lib/` — pas de `fetch()` inline dans un Server Component
- [ ] Les Client Components passent par des Next.js Route Handlers — jamais d'appel direct navigateur → Symfony
- [ ] Le pattern `useEffect` GET au montage + `onSubmit` PATCH est respecté — pas de React Hook Form ni Zustand introduits

**Hygiène des composants**
- [ ] Pas de `'use client'` inutile — Server Components par défaut
- [ ] Pas de `any` en TypeScript
- [ ] Pas de logique métier dans les composants UI — rester présentationnels

**Couche API**
- [ ] Les appels API passent par `lib/vendor.ts` (ou la lib dédiée), pas de `fetch()` inline dans les composants
- [ ] Chaque `fetch()` vérifie `res.ok` avant de consommer la réponse

**Guards vendor_type**
- [ ] Les sections conditionnelles Lieu/Traiteur sont contrôlées via `sections_status` de `GET /api/v1/vendors/me` — aucune logique dupliquée côté backend

---

#### Règles générales / Wedly

**Périmètre MVP**
- [ ] Pas de code ajouté au-delà du périmètre explicitement demandé — signaler le scope creep en 🟠

**Images & assets**
- [ ] Aucune image stockée localement sur le VPS — tout passe par Cloudinary
- [ ] Les nouvelles `portfolio_photos` ont des métadonnées de style/catégorie (compatibilité moodboard Année 2)

**Design system**
- [ ] Pas de couleur hardcodée en dehors du design system — toujours les classes Tailwind ou `var(--color-xxx)`
- [ ] Les nouvelles couleurs sémantiques (succès, danger…) sont ajoutées comme tokens dans `globals.css`

**Données & Fixtures**
- [ ] Les fixtures utilisent des données françaises réalistes (pas de "John Doe", "test@test.com", lorem ipsum)

**Hygiène git**
- [ ] Les commits sont en anglais
- [ ] La branche suit le nommage `feature/` ou `refactor/` — aucun commit direct sur `develop`

---

### Étape 3 — Présenter les constats

Regrouper par sévérité :

```
## Wedly Review — <branche ou titre de PR>

### 🔴 Bloquants
- <constat> — <fichier:ligne si pertinent>

### 🟠 Avertissements
- <constat>

### 🟡 Dette technique (non-bloquant)
- <constat>

### ✅ RAS
<sections sans constat>
```

Omettre un niveau de sévérité s'il n'a aucun constat.

Après avoir présenté les constats, demander à l'utilisateur s'il souhaite appliquer les corrections.
