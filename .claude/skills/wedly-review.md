# /wedly-review — Code review aux conventions Wedly

## Ce que fait ce skill

Passer en revue le diff courant (`git diff develop...HEAD` + `git diff HEAD`) en vérifiant :
1. Les conventions strictes du projet Wedly (CLAUDE.md)
2. La présence de tests pour chaque nouvelle fonctionnalité
3. La cohérence entre le schéma, les entités et les migrations

---

## Instructions

### Étape 1 — Récupérer le diff complet

```bash
git diff develop...HEAD
git diff HEAD
git status --short
```

Inclure les fichiers non-trackés (`??`) dans la revue — ils peuvent contenir du code sans tests ni schéma.

---

### Étape 2 — Checklist conventions Wedly

Pour chaque fichier modifié, vérifier les règles suivantes et **signaler toute violation** :

#### Backend (apps/api/)

| Règle | Vérification |
|---|---|
| Identifiants SQL | snake_case uniquement (colonnes, tables, indexes) |
| Classes PHP | PascalCase |
| Clés primaires | UUID v7 — vérifier `Uuid::v7()` dans les fixtures/factories |
| Valeurs monétaires | Toujours en centimes entiers (`price_cents`, `budget_cents`) — jamais de `float` |
| Timestamps | Toute nouvelle entité doit avoir `TimestampableTrait` |
| ManyToMany | Toujours des join tables explicites — jamais `cascade` ou gestion silencieuse Doctrine |
| PLAN.category_count | `-1` = illimité, jamais `null` ni booléen séparé |
| Architecture | Single Action Controllers — une classe = une action |
| Schéma | Tout nouveau champ doit être dans `docs/wedly_schema_v3.mmd` avant d'être dans l'entité |
| Migrations | Vérifier l'ordre Wave 1 → 2 → 3 si une migration est ajoutée |
| Langue | Messages de validation/erreur en **français** |

#### Frontend (apps/web/)

| Règle | Vérification |
|---|---|
| Couleurs | Uniquement les classes du design system (bordeaux, creme, accent, highlight, texte, gris) — jamais de couleur hardcodée |
| Server / Client | Server Components pour le fetch, Client Components pour l'interactivité — jamais l'inverse |
| Fetches client | Tout appel API depuis un Client Component passe par une Route Handler (`app/api/`) |
| Fonts | `font-cormorant` pour les titres, `font-manrope` pour le corps |
| `any` | Interdit — typer explicitement |

---

### Étape 3 — Vérification des tests

Pour chaque **nouveau Controller**, **Service**, **Handler** ou **Builder** ajouté dans `apps/api/src/`, vérifier qu'un test existe dans `apps/api/tests/`.

**Règles :**
- Nouveau `Controller/` → au moins un test fonctionnel (statut HTTP, shape de la réponse)
- Nouveau `Service/` ou `Handler/` → au moins un test unitaire couvrant le cas nominal et un cas d'erreur
- Nouveau `Builder/` ou `Resolver/` → test unitaire sur la logique de mapping
- Nouvelles fixtures → pas de test requis

Si un fichier source est ajouté **sans test correspondant**, le signaler comme **bloquant**.

Commande pour lister les tests existants :
```bash
find apps/api/tests -name "*Test.php" | sort
```

---

### Étape 4 — Vérification du schéma

Si des champs sont ajoutés à une entité PHP :
1. Vérifier qu'ils sont dans `docs/wedly_schema_v3.mmd`
2. Vérifier qu'une migration existe (ou qu'elle est à créer)

Si le schéma est en retard sur le code → signaler comme **bloquant**.

---

### Étape 5 — Rapport

Produire un rapport structuré :

```
## Revue Wedly — <branche ou description>

### 🔴 Bloquant
- <fichier:ligne> — <violation>

### 🟡 À corriger avant merge
- <fichier:ligne> — <problème>

### 🟢 OK
- Conventions respectées sur : <liste des fichiers propres>

### 🧪 Tests
- ✅ <NomAction> → test présent dans <chemin>
- ❌ <NomAction> → aucun test trouvé [BLOQUANT]
```

Si aucun problème → répondre : `✅ Rien à signaler — prêt pour /ship.`
