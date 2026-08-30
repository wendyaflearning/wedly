# Wedly — Project context for Claude Code

## What this project is

Wedly is a French SaaS platform for wedding planning. It connects couples with vendors
(photographers, caterers, DJs, florists, etc.) via a multi-criteria matching algorithm
called Wedmatch. The platform has two sides: couples and vendors.

This is an MVP. Scope is intentionally limited. Do not add features that are not asked for.

---

## Monorepo structure

```
wedly/
├── apps/
│   ├── api/        ← Symfony 7 backend (work happens here)
│   └── web/        ← Next.js frontend (out of scope for now)
└── docs/
    └── schema/
        └── wedly_schema_v3.mmd   ← Database schema — source of truth
```

All backend work is in `apps/api/`. Never touch `apps/web/` unless explicitly asked.

---

## Tech stack — backend

- **Framework**: Symfony 7, PHP 8.3
- **Database**: PostgreSQL (latest), Doctrine ORM
- **Architecture**: Single Action Controllers
- **Auth**: Symfony Security (to be added later, not in scope for DB setup)

---

## Database conventions — strictly enforced

| Rule | Value |
|---|---|
| SQL identifiers | snake_case |
| PHP class names | PascalCase |
| Primary keys | UUID v7 |
| Monetary values | integer cents (e.g. `price_cents`, `budget_cents`) — never floats |
| Timestamps | All entities have `created_at` and `updated_at` via `TimestampableTrait` |
| ManyToMany joins | Always explicit join tables — never let Doctrine manage them silently |

### Special convention — PLAN.category_count

`category_count` is an integer. The value `-1` means "unlimited" (premium plan).
Do not use nullable or a separate boolean for this.

---

## Database schema

Reference file: `docs/schema/wedly_schema_v3.mmd`

This file is the single source of truth for all entities, fields, and relations.
Read it before generating any entity or migration. Do not invent fields that are not in the schema.

### Entity dependency order (respect this for migrations)

**Wave 1 — Reference tables (no FK dependencies)**
`STYLE` · `CULTURE` · `CONFESSION` · `SERVICE` · `PLAN`

**Wave 2 — Core entities**
`USER` → `VENDOR` → `COUPLE` → `WEDDING` → `OFFER` → `SUBSCRIPTION`

**Wave 3 — Join tables and dependents**
`vendor_service` · `vendor_style` · `vendor_culture` · `vendor_confession`
`wedding_style` · `wedding_culture` · `wedding_confession`
`portfolio_image_style` · `PORTFOLIO_IMAGE` · `BOOKING_BLOCKER`

Migrations must be generated and executed in this order. Symfony generates migration
filenames alphabetically — verify the order is correct before running.

---

## What you should NOT do

- Do not generate CRUD controllers or API endpoints unless explicitly asked
- Do not add fields that are not in the schema
- Do not use Doctrine to silently manage ManyToMany join tables
- Do not use floats for monetary values
- Do not create entities without `TimestampableTrait`
- Do not run `doctrine:migrations:migrate` without a `--dry-run` check first
- Do not touch `apps/web/`

---

## Validation checklist after generating entities

Run these three commands in order before declaring work done:

```bash
php bin/console doctrine:schema:validate
php bin/console doctrine:migrations:migrate --dry-run
php bin/console doctrine:fixtures:load --env=test
```

If `schema:validate` reports mapping errors, fix them before proceeding.

---

## DataFixtures — reference tables

The following tables must be populated via DataFixtures (not via API):
`STYLE` · `CULTURE` · `CONFESSION` · `SERVICE` · `PLAN`

Generate realistic French wedding data for fixtures. Examples:
- STYLE: bohème, champêtre, chic, moderne, vintage, classique
- CULTURE: continent (Europe, Afrique, Asie…) and country (France, Maroc, Sénégal…)
- CONFESSION: catholique, musulman, juif, protestant, laïc, orthodoxe
- SERVICE: photographe, vidéaste, traiteur, DJ, fleuriste, lieu de réception
- PLAN: découverte (9€, 1 catégorie), essentiel (29€, 3 catégories), premium (99€, -1 = illimité)

## Gestion du contexte
- Ne jamais cat un fichier entier sauf si explicitement demandé
- Préférer grep pour localiser, puis lire uniquement la section pertinente
- Pour les fichiers > 100 lignes, lire uniquement les méthodes/blocs concernés

---

## Memory vault — règles métier

Après chaque implémentation de feature ou de fix, identifier les règles métier impliquées
et les sauvegarder dans le memory vault (`docs/memory-vault/`).

**Ce qui doit être capturé :**
- Toute contrainte métier non évidente (ex. : une zone unique par créateur, tarification
  par zone, limite de catégories selon le plan)
- Toute décision de modélisation dictée par le produit plutôt que par la technique
- Toute règle de validation qui protège une invariant métier

**Ce qui ne doit PAS être capturé :**
- Les conventions techniques déjà dans ce fichier (DB conventions, stack, etc.)
- Les détails d'implémentation (noms de classes, chemins de fichiers)
- L'état en cours de tâche (utiliser les tasks pour ça)

**Format attendu** : type `project`, avec une ligne **Why:** (la règle produit à l'origine)
et une ligne **How to apply:** (comment en tenir compte dans les prochains changements).
