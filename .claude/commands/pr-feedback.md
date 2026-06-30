# pr-feedback

Lit les retours de review d'une PR GitHub et poste une réponse structurée directement sur la PR.
**Ne pas appliquer de fixes** — l'objectif est uniquement de répondre aux findings dans un commentaire.

## Usage

```
/pr-feedback <PR_NUMBER>
```

## Étapes

### 1. Récupérer les retours

```bash
gh pr view $PR_NUMBER --comments
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pulls/$PR_NUMBER/comments
```

### 2. Analyser les findings

Regroupe les findings par priorité (🔴 High / 🟠 Medium / 🟡 Low).
Pour chaque finding, détermine :
- S'il est **déjà résolu** dans la branche (lire les fichiers concernés)
- S'il reste **à corriger** (sera traité dans un commit ultérieur)
- S'il est **ignoré** (avec raison explicite)

### 3. Poster la réponse sur la PR

```bash
gh pr comment $PR_NUMBER --body "$(cat <<'EOF'
<commentaire>
EOF
)"
```

Format du commentaire :

```markdown
## Réponse à la review

**🔴 High X — <titre du finding>**
<Statut : déjà résolu / sera corrigé / ignoré — 2-3 lignes max. Pas de justification — juste les faits.>

**🟠 Medium X — <titre>**
<idem>

**🟡 Low X — <titre ou "Ignoré" avec raison courte>**

---

<Note sur les tests si applicable>
```

Règles du commentaire :
- Concis : une réponse par finding, 2-3 lignes max
- Indiquer explicitement pour chaque finding s'il est résolu, à faire, ou ignoré
- Ne pas répéter le contenu de la review, seulement le statut et les faits
