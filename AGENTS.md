# Wedly — Project context for Codex

## What this project is

Wedly is a French SaaS platform for wedding planning. It connects couples with vendors
(photographers, caterers, DJs, florists, etc.) via a multi-criteria matching algorithm
called Wedmatch. The platform has two sides: couples and vendors.

This is an MVP. Scope is intentionally limited. Do not add features that are not asked for.

---

## Monorepo structure

```text
wedly/
├── apps/
│   ├── api/        ← Symfony 7 backend
│   └── web/        ← Next.js frontend
└── docs/
    └── schema/
        └── wedly_schema_v3.mmd   ← Database schema — source of truth
```

- Backend work usually happens in `apps/api/`.
- Frontend work should stay in `apps/web/`.
- Do not touch both sides unless the task actually requires full-stack closure.

---

## Tech stack — backend

- **Framework**: Symfony 7
- **PHP**: 8.3 target
- **Database**: PostgreSQL, Doctrine ORM
- **Architecture**: Single Action Controllers
- **Auth**: Symfony Security + JWT

---

## Tech stack — frontend

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS

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

### Special convention — `PLAN.category_count`

`category_count` is an integer. The value `-1` means "unlimited" (premium plan).
Do not use nullable or a separate boolean for this.

---

## Database schema

Reference file: `docs/schema/wedly_schema_v3.mmd`

This file is the single source of truth for entities, fields, and relations.
Read it before generating entities or migrations. Do not invent fields that are not in the schema.

### Entity dependency order

**Wave 1 — Reference tables (no FK dependencies)**
`STYLE` · `CULTURE` · `CONFESSION` · `SERVICE` · `PLAN`

**Wave 2 — Core entities**
`USER` → `VENDOR` → `COUPLE` → `WEDDING` → `OFFER` → `SUBSCRIPTION`

**Wave 3 — Join tables and dependents**
`vendor_service` · `vendor_style` · `vendor_culture` · `vendor_confession`
`wedding_style` · `wedding_culture` · `wedding_confession`
`portfolio_image_style` · `PORTFOLIO_IMAGE` · `BOOKING_BLOCKER`

Verify migration order before execution.

---

## What you should NOT do

- Do not generate CRUD controllers or API endpoints unless explicitly asked.
- Do not add fields that are not in the schema.
- Do not use Doctrine to silently manage ManyToMany join tables.
- Do not use floats for monetary values.
- Do not create entities without `TimestampableTrait`.
- Do not run destructive local environment commands unless necessary and understood.
- Do not modify frontend and backend together unless the requirement crosses both.

---

## Backend validation checklist

Run these before declaring backend entity or schema work done:

```bash
php bin/console doctrine:schema:validate
php bin/console doctrine:migrations:migrate --dry-run
php bin/console doctrine:fixtures:load --env=test
```

If `schema:validate` reports mapping errors, fix them first.

---

## DataFixtures — reference tables

The following tables must be populated via DataFixtures, not via API:
`STYLE` · `CULTURE` · `CONFESSION` · `SERVICE` · `PLAN`

Generate realistic French wedding data for fixtures. Examples:

- STYLE: bohème, champêtre, chic, moderne, vintage, classique
- CULTURE: continent (Europe, Afrique, Asie…) and country (France, Maroc, Sénégal…)
- CONFESSION: catholique, musulman, juif, protestant, laïc, orthodoxe
- SERVICE: photographe, vidéaste, traiteur, DJ, fleuriste, lieu de réception
- PLAN: découverte (9€, 1 catégorie), essentiel (29€, 3 catégories), premium (99€, `-1` = illimité)

---

## Local dev hygiene

- If you start a local dev server for verification, stop it before ending the task unless the user explicitly asked to keep it running.
- Before finishing local runtime work, check whether touched ports are still occupied by processes started during the task.
- Be careful with common local ports: `3000`, `3004`, `5432`, `8000`, `8001`.

