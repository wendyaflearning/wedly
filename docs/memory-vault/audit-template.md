# Memory Vault Audit Template

Copier ce template dans `docs/memory-vault/audits/YYYY-MM-DD-<scope>.md`.

## Métadonnées

- Date :
- Auditeur :
- Scope :
- Branche ou commit :
- PR / ticket :

## Résumé

- Conclusion :
- Risque global : `low` / `medium` / `high`
- Règles auditées :
- Règles non auditées :

## Vérification des règles

| ID | Statut vault | Code aligné ? | Tests alignés ? | Commentaire |
|---|---|---|---|---|
|  |  |  |  |  |

## Écarts détectés

Pour chaque écart :

- ID de règle :
- Catégorie : `business bug` / `missing coverage` / `documentation drift` / `test drift` / `tech debt`
- Impact pratique :
- Introduit par :
- Fichiers concernés :
- Correction recommandée :

## Tests exécutés

- Commande :
- Résultat :
- Limites :

## E2E impact

- Parcours utilisateur concerné :
- Test E2E existant :
- Test E2E à ajouter ou mettre à jour :
- Scénario happy path minimal :
- Edge cases réalistes :

## Réactivité frontend

- Code Vue/Nuxt concerné : non applicable pour Wedly actuellement
- Code React/Next.js concerné :
- Risque de state dupliqué, effet async fragile ou source de vérité multiple :

## Backend testability

- Règles métier dans services testables :
- Règles métier restées dans controllers/handlers/repositories :
- Extraction recommandée :

## Actions

| Action | Priorité | Responsable | Statut |
|---|---|---|---|
|  |  |  |  |
