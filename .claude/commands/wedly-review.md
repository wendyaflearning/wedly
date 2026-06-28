# /wedly-review — Wedly-specific PR review

Review the current branch diff (or a GitHub PR) against Wedly conventions and MVP scope rules.

## Usage

```
/wedly-review          ← reviews current branch diff vs develop
/wedly-review <PR#>    ← reviews a GitHub PR
```

---

## Instructions

### Step 1 — Get the diff

**From a PR number:**
```bash
gh pr diff <PR#>
gh pr view <PR#> --json title,body,files
```

**From current branch:**
```bash
git diff develop...HEAD
git diff develop...HEAD --stat
```

### Step 2 — Run the checklist

Go through each section below. For every finding, assign a severity:

- 🔴 **Blocker** — must be fixed before merge
- 🟠 **Warning** — should be fixed, acceptable to merge with a note
- 🟡 **Tech debt** — non-blocking, flag for awareness

---

#### Backend (Symfony / PHP)

**Architecture**
- [ ] Controllers are Single Action and thin — no business logic inside them
- [ ] DTOs and Assemblers are separate classes — no inline mapping in the controller
- [ ] Business logic lives in services, not in DTOs or controllers

**API & Security**
- [ ] Auth guards are in place on endpoints, or explicitly marked `// TODO auth`
- [ ] HTTP status codes are correct: 400/404/422 for client errors, not 500 generics

**Database & Schema**
- [ ] No fields added that are not in `docs/schema/wedly_schema_v3.mmd`
- [ ] SQL identifiers are snake_case, PHP classes are PascalCase
- [ ] Monetary values use integer cents (e.g. `price_cents`) — no floats
- [ ] All new entities use `TimestampableTrait`
- [ ] Primary keys are UUID v7
- [ ] ManyToMany relations use explicit join tables — no silent Doctrine management
- [ ] New migrations respect the entity dependency order (Wave 1 → 2 → 3)
- [ ] New FK columns have a corresponding index in the migration

**Performance**
- [ ] No N+1 queries — check for `findBy` or repository calls inside loops

**Code style**
- [ ] Closure parameters use explicit names: `fn($service)` not `fn($s)`

**Tests** *(non-blocking — tech debt)*
- [ ] New services or business logic have a corresponding test in `tests/Unit/`
  - If missing: flag as 🟡 tech debt, not a blocker

---

#### Frontend (Next.js / TypeScript)

**Component hygiene**
- [ ] No unnecessary `'use client'` — Server Components by default
- [ ] No `any` in TypeScript
- [ ] No business logic inside UI components — keep them presentational

**API layer**
- [ ] API calls go through `lib/vendor.ts` (or the dedicated lib layer), not inline `fetch()` in components
- [ ] Every `fetch()` checks `res.ok` before consuming the response

---

#### General / Wedly rules

**MVP scope**
- [ ] No code added beyond the explicitly requested scope — flag scope creep as 🟠

**Data & Fixtures**
- [ ] Fixtures use realistic French data (no "John Doe", "test@test.com", lorem ipsum)

**Git hygiene**
- [ ] Commits are in English
- [ ] Branch follows `feature/` or `refactor/` naming — no direct commits to `develop`

---

### Step 3 — Report findings

Group findings by severity and present them clearly:

```
## Wedly Review — <branch or PR title>

### 🔴 Blockers
- <finding> — <file:line if relevant>

### 🟠 Warnings
- <finding>

### 🟡 Tech debt (non-blocking)
- <finding>

### ✅ All clear
<sections with no findings>
```

If there are no findings in a severity tier, omit that tier.

After presenting findings, ask the user if they want you to apply the fixes.
