# pr-feedback

Traite les retours de review d'une PR GitHub et poste une réponse structurée.

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

### 2. Analyser et planifier

Regroupe les findings par priorité (🔴 High / 🟠 Medium / 🟡 Low) et présente un plan avant d'agir.
Attendre la validation de l'utilisateur sur les points ambigus (choix d'architecture, UX).

### 3. Appliquer les fixes

Respecter les conventions Wedly (CLAUDE.md) :
- PHP : `BookingBlockerService`, `DomainException`, Single Action Controllers
- TypeScript : pas de `any`, snake_case pour les clés JSON
- Routes : kebab-case, nommage sémantique (ce que la route retourne, pas ce qu'on voudrait)
- Jamais `fetch()` sans vérifier `res.ok` côté client
- Règles métier dans le service, pas dans le DTO

Après chaque fix backend, vérifier :
```bash
php bin/console lint:container
php bin/console debug:router | grep <resource>
```

Après chaque fix frontend :
```bash
npm run lint 2>&1 | grep <fichier_modifié>
```

### 4. Poster la réponse sur la PR

Format du commentaire :

```markdown
## Changements appliqués suite à la review

**🔴 High X — <titre du finding>**
<Ce qui a été fait, en 2-3 lignes max. Pas de justification — juste les faits.>

**🟠 Medium X — <titre>**
<idem>

**🟡 Low X — <titre ou "Ignoré" avec raison courte>**

---

<Note sur les tests si applicable>
```

Règles du commentaire :
- Concis : une réponse par finding, 2-3 lignes max
- Si un finding est ignoré, l'indiquer explicitement avec la raison
- Ne pas répéter le contenu de la review, seulement ce qui a changé
EOF
