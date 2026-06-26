# ship

Workflow complet pour shipper une feature : branche → commit → PR avec description complète.

## Usage

```
/ship
```

---

## Étape 1 — Vérifier la branche

Lire le résultat de `git branch --show-current` et `git status`.

- Si on est sur `develop` ou `main` : **s'arrêter immédiatement** et demander à l'utilisateur sur quelle branche travailler. Ne jamais committer directement sur `develop`.
- Si on est déjà sur une branche `feature/` ou `fix/` : continuer.
- Si l'utilisateur doit créer une branche, lui proposer un nom au format `feature/<nom-kebab-case>` basé sur les fichiers modifiés, et attendre sa validation avant de la créer.

---

## Étape 2 — Scanner le diff

```bash
git diff --staged
git diff
```

Chercher dans le diff les artefacts de debug suivants et signaler chacun trouvé :
- PHP : `dd(`, `dump(`, `var_dump(`, `die(`, `exit(`
- JS/TS : `console.log(`, `console.error(`, `debugger`
- Général : `TODO`, `FIXME`, `HACK`, `XXX`

Si des artefacts sont trouvés : les lister clairement et **s'arrêter**. Demander à l'utilisateur de les nettoyer avant de continuer.

---

## Étape 3 — Lancer les tests

Détecter quels types de fichiers sont modifiés :

**Si des fichiers `apps/api/` sont modifiés :**
```bash
cd apps/api && php bin/phpunit --testdox 2>&1 | tail -30
```

**Si des fichiers `apps/web/` sont modifiés :**
```bash
cd apps/web && npm run lint 2>&1 | head -50
```

Si les tests échouent : afficher les erreurs et **s'arrêter**. Ne pas continuer vers le commit.

---

## Étape 4 — Préparer le commit

Lancer un `git diff` complet et résumer :
- Les fichiers modifiés (groupés par domaine : controllers, services, entities, tests, etc.)
- L'intention principale du changement (le "pourquoi", pas le "quoi")

Rédiger un message de commit en anglais au format :
```
<type>(<scope>): <description courte>
```
Types valides : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

Présenter à l'utilisateur :
1. La liste des fichiers qui seront inclus
2. Le message de commit proposé

**Attendre la validation explicite avant de committer.**

Une fois validé, stager et committer :
```bash
git add <fichiers spécifiques — jamais git add -A ou git add .>
git commit -m "..."
```

---

## Étape 5 — Créer la PR

Collecter les infos nécessaires :
```bash
git log develop..HEAD --oneline
git diff develop...HEAD --stat
```

Rédiger la PR avec ce format :

**Titre** : court, < 70 caractères, en anglais, même format que le commit.

**Body** :

```markdown
## Résumé

- <bullet 1 — changement principal>
- <bullet 2>
- <bullet 3 si pertinent>

## Fichiers touchés

| Fichier | Nature du changement |
|---|---|
| `path/to/file.php` | Nouveau service |
| `path/to/other.php` | Refactorisé |

## Plan de tests

- [ ] <Action concrète à tester manuellement>
- [ ] <Cas nominal>
- [ ] <Cas limite ou edge case>
- [ ] Tests automatisés passent (`php bin/phpunit`)

## Breaking changes

<!-- Supprimer cette section s'il n'y en a pas -->
- <Décrire tout changement qui casse la compatibilité>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Présenter la PR rédigée à l'utilisateur et **attendre sa validation avant de pousser**.

Une fois validé :
```bash
git push -u origin <branche>
gh pr create --base develop --title "..." --body "..."
```

Afficher l'URL de la PR créée.

---

## Étape 6 — Mettre à jour la mémoire

Si cette feature a impliqué une décision non-évidente (choix d'architecture, convention nouvelle, contournement d'un bug), proposer à l'utilisateur de la sauvegarder en mémoire.

Ne pas sauvegarder automatiquement — demander d'abord.
