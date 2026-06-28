# Data and Schema Rules

## Scope

Règles transverses liées au modèle de données, aux conventions Doctrine et aux
référentiels.

Sources principales :

- `docs/wedly_schema_v3.mmd`
- `AGENTS.md`
- `apps/api/src/Entity/`
- `apps/api/src/DataFixtures/`
- `apps/api/migrations/`

## DATA-SCHEMA-001 — Montants en centimes entiers

Statut : `active`

Tous les montants doivent être stockés en centimes entiers.

Exemples :

- `price_cents`
- `price_min_cents`
- `price_max_cents`
- `budget_cents`
- `amount_paid_cents`

Interdit :

- `float`
- montant en euros stocké directement
- calcul monétaire non explicite entre euros et centimes

Couverture attendue :

- tests unitaires des services qui manipulent des montants
- validation des DTO quand un montant arrive depuis une API

## DATA-SCHEMA-002 — `PLAN.category_count = -1`

Statut : `active`

Pour un plan premium, `category_count = -1` signifie illimité.

Interdit :

- `null` pour exprimer l'illimité
- booléen séparé comme `is_unlimited`
- logique frontend/backend divergente autour de l'illimité

Point d'audit :

- vérifier que les futurs écrans de plan et règles d'abonnement interprètent
`-1` de la même manière.

## DATA-SCHEMA-003 — Tables de jointure explicites

Statut : `active`

Les relations ManyToMany doivent passer par des tables de jointure explicites.
Doctrine ne doit pas créer silencieusement une table de jointure implicite.

Raison :

- garder le schéma maîtrisé
- permettre d'ajouter des champs métier sur les relations si nécessaire
- éviter les migrations surprises

Couverture attendue :

- `php bin/console doctrine:schema:validate`
- revue des migrations générées avant exécution

## DATA-SCHEMA-004 — Référentiels par fixtures

Statut : `active`

Les référentiels suivants sont chargés via DataFixtures, pas via API métier :

- `STYLE`
- `CULTURE`
- `CONFESSION`
- `SERVICE`
- `PLAN`

Raison :

- garder les référentiels contrôlés pour le MVP
- éviter les écarts de données qui changeraient le comportement produit

Couverture attendue :

- `php bin/console doctrine:fixtures:load --env=test`
- tests qui s'appuient sur des fixtures stables quand la règle métier dépend
des référentiels

Point d'audit :

- toute API de création/modification de référentiel doit être justifiée par un
besoin produit explicite.
