# Couple Onboarding Rules

## Scope

Règles liées au parcours de création de compte couple (écrans 1 à 8) et à son
modèle de données.

Sources principales :

- `apps/api/src/Entity/Couple/Couple.php`
- `apps/api/src/Entity/Wedding/Wedding.php`
- `apps/api/src/Enum/Couple/PlanningStage.php`
- `apps/api/src/DTO/Onboarding/CoupleInviteTokenDataDto.php`

## COUPLE-ONBOARDING-001 — Rien n'est persisté avant l'écran final

Statut : `active`

Les écrans 1 à 6 du parcours de création de compte couple n'écrivent rien en
base. L'état est porté côté frontend (store Next.js, expiration ~30 min s'il
n'est pas validé) puis soumis en un seul appel atomique à l'écran final, qui
crée `User` + `Couple` + `Wedding` + consentement + lead dans la même
transaction.

Raison :

- `Couple.user` et `Couple.wedding` sont `NOT NULL` : un `Wedding` ne peut pas
exister sans compte associé.
- Les écrans intermédiaires collectent des données RGPD sensibles (cultures,
confessions) qu'on ne veut pas persister avant qu'un titulaire de compte soit
identifié.

Interdit :

- ajouter un endpoint / contrôleur `Wedding` ou `Couple` de sauvegarde
partielle pour les écrans intermédiaires
- persister un brouillon backend pendant le parcours

Couverture attendue :

- revue de toute nouvelle route d'onboarding couple : vérifier qu'elle ne
persiste qu'à l'étape finale.

## COUPLE-ONBOARDING-002 — Avancement de l'organisation ≠ état du compte

Statut : `active`

Le statut d'avancement de l'organisation du mariage (« on vient de commencer »
/ « on est en plein dedans » / « on est presque prêts ») est porté par
`App\Enum\Couple\PlanningStage`, sur `Couple.planningStage`. Il est distinct
de `App\Enum\Couple\CoupleStatus` (`pending`/`active`), qui décrit l'état du
compte lui-même.

Interdit :

- fusionner `PlanningStage` et `CoupleStatus` dans un seul enum
- réutiliser `CoupleStatus` pour exprimer l'avancement de l'organisation

Couverture attendue :

- `apps/api/tests/Unit/Enum/Couple/PlanningStageTest.php`
- tests instanciant `Couple` doivent fournir `planningStage` (colonne
`NOT NULL` sans valeur par défaut dans le mapping).

## COUPLE-ONBOARDING-003 — `NULL` sur `Wedding.zone`/`ambiance`/`ceremonyType` signifie « non renseigné »

Statut : `active`

`Wedding.zone`, `Wedding.ambiance` et `Wedding.ceremonyType` sont `nullable`.
`NULL` signifie « non renseigné », pas de valeur par défaut.

Raison :

- une valeur par défaut serait relue par Wedmatch comme une vraie préférence
et fausserait le matching.

Interdit :

- donner une valeur par défaut à ces 3 colonnes (mapping ou migration)
- traiter `NULL` comme une valeur métier (ex. « aucune préférence de zone »)

Couverture attendue :

- `apps/api/tests/Unit/DTO/OnboardingResponseDtoTest.php` (cas `null`)
- tout consommateur de `Wedding::getZone()` / `getAmbiance()` /
`getCeremonyType()` doit gérer le cas `null` explicitement (accès sûr `?->`).

Implémentation actuelle :

- `apps/api/migrations/Version20260812072133.php`
