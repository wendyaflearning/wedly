# Wedly Memory Vault

Le Memory Vault est le registre vivant des règles métier Wedly. Il sert à
sécuriser les décisions déjà prises, à guider les futures implémentations et à
éviter les régressions quand le produit évolue.

Il ne remplace pas le code, les tests, le schéma ou les ADR. Il relie ces
sources entre elles.

## Objectifs

- rendre chaque règle métier explicite et retrouvable
- documenter où la règle est appliquée dans le code
- préciser quelle couverture de tests protège la règle
- identifier les zones où une dérive est possible
- faciliter les audits réguliers sans relire tout le projet

## Sources de vérité

| Source | Role |
|---|---|
| `docs/wedly_schema_v3.mmd` | Source de vérité du modèle de données cible |
| `docs/ADR/` | Décisions d'architecture acceptées |
| `docs/memory-vault/rules/` | Règles métier actives et leurs protections |
| `apps/api/tests/` et futurs tests frontend/E2E | Preuves de non-régression |
| Code applicatif | Implémentation effective |

Quand une règle métier contredit le code, le vault doit signaler l'écart, pas
le masquer. L'audit sert précisément à détecter ce type de divergence.

## Structure

```text
docs/memory-vault/
├── README.md
├── business-rules-index.md
├── audit-template.md
├── audits/
│   └── README.md
└── rules/
    ├── admin-vendor-lifecycle.md
    ├── data-and-schema.md
    ├── invite-tokens.md
    └── vendor-onboarding.md
```

## Cycle de vie d'une règle

Une règle passe par cinq statuts possibles :

| Statut | Signification |
|---|---|
| `draft` | Règle proposée, pas encore validée produit/tech |
| `active` | Règle applicable et attendue dans le produit |
| `at-risk` | Règle active mais couverture ou implémentation fragile |
| `deprecated` | Règle remplacée, conservée pour historique |
| `removed` | Règle supprimée du périmètre produit |

## Format minimal d'une règle

Chaque entrée doit contenir :

- un identifiant stable, par exemple `VENDOR-ONBOARDING-001`
- le statut
- l'énoncé métier
- la raison produit
- les emplacements code concernés
- les tests attendus ou existants
- les risques de régression
- les points à auditer

## Quand mettre à jour le vault

Le vault doit être mis à jour quand une PR :

- ajoute ou modifie une règle métier
- change un statut, une permission, une validation ou une transition
- change un workflow utilisateur important
- modifie une règle de calcul, de prix, d'éligibilité ou d'expiration
- déplace une règle entre controller, service, handler, composable ou store
- corrige un bug lié à une règle métier implicite

Si le changement est purement visuel, purement technique ou sans impact métier,
le vault n'a pas besoin d'être modifié.

## Définition de done pour une règle métier

Une règle métier est considérée protégée quand :

- elle est documentée dans `docs/memory-vault/rules/`
- le code qui l'applique est identifié
- au moins un test protège le comportement central, sauf justification explicite
- le scénario E2E attendu est décrit si la règle touche un parcours utilisateur
- les risques de réactivité frontend ou d'effets de bord backend sont évalués

## Audit régulier

Un audit du Memory Vault doit vérifier :

- les règles `active` sont toujours vraies dans le code
- les règles `at-risk` ont une action de réduction du risque
- les tests cités existent encore et couvrent vraiment le comportement
- les PR récentes n'ont pas introduit de règles métier non documentées
- les descriptions produit, messages utilisateur et comportements réels restent alignés

Utiliser `audit-template.md` pour consigner chaque audit.
