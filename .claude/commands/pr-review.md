# pr-review

Effectue une review complète d'une PR GitHub : analyse par couche, commentaires inline sur les findings précis, résumé global posté comme review GitHub avec le bon event type.

## Usage

```
/pr-review <PR_NUMBER>
```

---

## Étape 0 — Pré-review : comprendre avant d'analyser

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Contexte général
gh pr view $PR_NUMBER --json title,body,author,baseRefName,headRefName,additions,deletions

# Liste des fichiers modifiés
gh api repos/$REPO/pulls/$PR_NUMBER/files --jq '.[].filename'

# SHA du dernier commit (requis pour les inline comments)
LAST_COMMIT_SHA=$(gh api repos/$REPO/pulls/$PR_NUMBER/commits --jq '.[-1].sha')
```

**Avant d'ouvrir un seul fichier :**
1. Lire la description de la PR — comprendre ce que l'auteur prétend avoir fait
2. Catégoriser chaque fichier modifié par couche :
   - `Controller/` — point d'entrée HTTP
   - `Service/` — logique métier
   - `DTO/` — sérialisation/désérialisation
   - `Entity/` — mapping ORM
   - `Repository/` — accès données
   - `migrations/` — DDL
   - `tests/` — tests unitaires
   - `apps/web/` — frontend
3. Identifier si la PR est backend-only, frontend-only, ou full-stack → n'appliquer que les vérifications pertinentes

---

## Étape 1 — Analyser chaque couche

Utiliser `Read` pour lire les **fichiers complets** (pas seulement le diff). Le diff manque de contexte.

### Controllers (`Controller/`)

- Classe `final` — pas d'héritage sauf `AbstractController` si nécessaire
- Un seul point d'entrée public : `__invoke()`
- Nom de classe suffixé `Action`
- **Aucune logique métier** — seulement délégation au service
- `\DomainException` catchée (jamais `\Exception` générique)
- `#[IsGranted('ROLE_VENDOR')]` ou équivalent présent si l'endpoint est protégé
- Pas d'`EntityManager` injecté directement dans le controller
- Pas de requête Doctrine directe — toujours via service ou repository

### Services (`Service/`)

- `\DomainException` pour erreurs métier avec code HTTP (422, 404, 403) — jamais `\RuntimeException` ou `\Exception`
- Queries Doctrine via repository injecté — pas via `EntityManager::find()` sur des entités tierces
- Closures avec nommage explicite : `fn(PortfolioImage $image)` jamais `fn($img)`
- Pas de `JsonResponse` ni d'imports HTTP dans un service
- `EntityManager::flush()` en fin de méthode, pas au milieu d'un bloc

### DTOs (`DTO/`)

- Classe `final readonly`
- Properties en `snake_case` (interop JSON avec le frontend)
- Pas de logique métier — ni validation, ni calcul
- Request DTO : désérialisation via attributs Symfony (`#[Context]`, `#[MapRequestPayload]`)
- Response DTO : constructeur prend une Entity, transforme vers le format wire (UUID → string, DateTimeImmutable → string Y-m-d)

### Entities (`Entity/`)

- `TimestampableTrait` présent — **bloquant** si absent sur une nouvelle entité
- UUID v7 via `UuidV7Generator` — pas d'auto-increment, pas d'UUID v4
- Valeurs monétaires en **centimes entiers** (`price_cents: int`) — **bloquant** si float
- Cross-référencer chaque champ avec `docs/schema/wedly_schema_v3.mmd` — aucun champ inventé
- ManyToMany toujours via join table explicite — jamais géré silencieusement par Doctrine

### Migrations (`migrations/`)

- Noms de colonnes et tables en `snake_case`
- Si plusieurs migrations dans la PR, vérifier l'ordre de dépendance (Wave 1 → Wave 2 → Wave 3)
- Tout `DROP COLUMN` ou `DROP TABLE` est **bloquant** sans justification dans la description de la PR
- Pas de migration sans dry-run mentionné — noter dans les findings si le dry-run n'est pas documenté

### Tests (`tests/`)

- Tout nouveau service doit avoir un fichier de test — **bloquant** si absent
- Nommage : `test_<méthode>_<scénario_attendu>()` en snake_case
- Mocks : `createStub()` pour les repositories, `createMock()` pour `EntityManagerInterface`
- Factory `makeService()` pour instancier le service testé — pas de `new` en dur dans chaque test
- Au moins un happy path + un cas `DomainException` par méthode publique

### Frontend (`apps/web/`)

- Pas de `any` TypeScript — typer explicitement
- `res.ok` vérifié après chaque `fetch()` ou appel API
- Clés JSON en `snake_case` (alignement avec l'API backend)
- Routes Next.js API en `kebab-case`
- Pas de logique métier dans les composants React — dans les hooks ou les utils

---

## Étape 2 — Classifier les findings

| Sévérité | Critères |
|---|---|
| 🔴 **Bloquant** | Bug, faille de sécurité, float pour valeur monétaire, entity sans `TimestampableTrait`, logique métier dans le controller, champ DB absent du schema, nouveau service sans test, `DROP` sans justification |
| 🟠 **Important** | Mauvais type d'exception, closure non nommée, requête Doctrine dans le controller, DTO non readonly, `flush()` mal placé, `#[IsGranted]` manquant |
| 🟡 **Suggestion** | Lisibilité, QueryBuilder simplifiable, commentaire superflu, nommage suboptimal mais non bloquant |

Pour chaque finding : noter la couche, le fichier, le numéro de ligne dans le fichier (version HEAD), la sévérité, et une description concise.

---

## Étape 3 — Déterminer l'event type GitHub

- `REQUEST_CHANGES` → si au moins un 🔴
- `COMMENT` → si seulement 🟠/🟡
- `APPROVE` → si aucun finding significatif (PR propre)

---

## Étape 4 — Validation avant publication

Avant de poster quoi que ce soit sur GitHub, présenter à l'utilisateur :

1. L'event type sélectionné (`REQUEST_CHANGES` / `COMMENT` / `APPROVE`) avec la raison
2. La liste complète des findings classés par sévérité (fichier + ligne + description)
3. Les 6 commentaires inline choisis (ou moins) avec leur texte exact
4. Le résumé global tel qu'il sera posté

Puis **attendre une confirmation explicite** avant de continuer. Ne pas poster si l'utilisateur ne valide pas.

---

## Étape 5 — Poster la review

**Cap inline comments : maximum 6.** Les findings au-delà vont dans le résumé global uniquement.

**Ton par sévérité :**
- 🔴 : affirmatif et factuel. _"Ce float violerait la convention centimes — utiliser `price_cents: int`."_
- 🟠 : question rhétorique. _"La validation de chevauchement ne devrait-elle pas rester dans le service ?"_
- 🟡 : suggestion ouverte. _"On pourrait aussi extraire ça dans une méthode privée pour la lisibilité."_

**Format du résumé global :**

```markdown
## Review — <titre de la PR>

### Vue d'ensemble

<2-3 phrases : ce que fait la PR, qualité générale, impression globale.>

### Findings

**🔴 Bloquant (<N>)**
- `chemin/fichier.php:ligne` — description concise

**🟠 Important (<N>)**
- `chemin/fichier.php:ligne` — description concise

**🟡 Suggestions (<N>)**
- description (pas forcément liée à une ligne)

### Verdict

<✅ Approuvé | ⚠️ Modifications requises | ❌ Changements majeurs nécessaires>

<Une phrase de conclusion.>
```

**Commande de posting (inline + résumé en une requête) :**

```bash
gh api repos/$REPO/pulls/$PR_NUMBER/reviews \
  --method POST \
  -f commit_id="$LAST_COMMIT_SHA" \
  -f body="$GLOBAL_BODY" \
  -f event="REQUEST_CHANGES" \
  -F 'comments[][path]=apps/api/src/Controller/Vendor/ExempleAction.php' \
  -F 'comments[][line]=42' \
  -F 'comments[][side]=RIGHT' \
  -F 'comments[][body]=🔴 Description du finding.'
```

Ajouter un quadruplet `-F 'comments[][path/line/side/body]'` par commentaire inline (max 6).

Si aucun finding inline, poster sans le bloc `comments` :

```bash
gh api repos/$REPO/pulls/$PR_NUMBER/reviews \
  --method POST \
  -f commit_id="$LAST_COMMIT_SHA" \
  -f body="$GLOBAL_BODY" \
  -f event="COMMENT"
```

---

## Ce que le skill NE doit PAS faire

- Ne pas reviewer le style si la convention n'est pas dans `CLAUDE.md`
- Ne pas inventer des findings pour "remplir" la review
- Ne pas poster plus de 6 commentaires inline
- Ne pas utiliser `APPROVE` s'il y a le moindre 🟠 non trivial
- Ne pas baser l'analyse uniquement sur le diff — toujours lire les fichiers complets avec `Read`
