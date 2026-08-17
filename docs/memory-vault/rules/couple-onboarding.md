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

## COUPLE-ONBOARDING-004 — La date de mariage ne peut pas être dans le passé

Statut : `active`

La date saisie à l'écran 2 est une date de mariage à venir : la borne minimum
est le jour courant. Les jours antérieurs restent visibles dans le calendrier
mais ne sont pas sélectionnables, et la navigation vers un mois entièrement
passé est bloquée.

Raison :

- une date passée n'a aucun sens métier pour un mariage à organiser et
polluerait le matching Wedmatch ainsi que les relances.

Interdit :

- masquer les jours passés (l'utilisateur perd le repère du mois)
- se contenter d'une validation à la soumission : la contrainte est portée par
la saisie elle-même

Couverture attendue :

- `apps/web/app/couple-onboarding/calendar.test.ts`

## COUPLE-ONBOARDING-005 — `budgetCents` et `guestCount` portent toujours une valeur

Statut : `active`

Les deux curseurs de l'écran 2 (budget, nombre d'invités) exposent dès le
premier rendu la graduation sur laquelle ils sont réellement positionnés, et
cette valeur est transmise à l'étape suivante même si le couple n'a jamais
touché le curseur.

Raison :

- `Wedding.budget_cents` et `Wedding.guest_count` sont `NOT NULL` : contrairement
à `zone`/`ambiance`/`ceremonyType` (voir `COUPLE-ONBOARDING-003`), l'absence de
valeur n'est pas représentable en base.
- un `<input type="range">` occupe toujours une graduation réelle : afficher un
libellé « non renseigné » décrivait un état que le contrôle ne peut pas avoir,
et rendait la première graduation inatteignable au clic direct.

Interdit :

- afficher un libellé de type « Choisissez une fourchette » sur un curseur déjà
positionné
- reconvertir la valeur d'un curseur en `undefined`

Le curseur invités démarre à `10` invités, qui est aussi sa borne minimale.
Toute valeur persistée inférieure à `10` est ramenée à cette borne afin qu'un
ancien état local ne puisse pas réintroduire `0` invité.

Couverture attendue :

- `apps/web/lib/couple-onboarding-store.test.ts` (`withSliderDefaults`)
