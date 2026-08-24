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

Les valeurs de départ et les graduations des deux curseurs viennent de la
source Claude Design, qui fait foi pour ce parcours : le curseur invités
démarre à `100` invités et sa borne minimale est `20` ; le curseur budget
ouvre sur `20 000 – 30 000 €` parmi cinq fourchettes.

Toute valeur persistée hors de ces bornes est ramenée à la valeur d'ouverture —
un ancien état local ne doit ni réintroduire une graduation supprimée, ni faire
retomber silencieusement le budget sur la fourchette la moins chère.

Le bornage vaut **dans les deux sens** : `sessionStorage` est réinscriptible par
l'utilisateur, et un `guestCount` au-delà du plafond du curseur (ou non fini)
traversait le parcours intact jusqu'à `wedding.guest_count`. Le DTO de l'écran 7
rejoue les mêmes bornes côté serveur : les garanties front protègent la saisie,
pas la base.

Couverture attendue :

- `apps/web/lib/couple-onboarding-store.test.ts` (`withSliderDefaults`)

## COUPLE-ONBOARDING-006 — Le prénom est saisi à l'écran 1 et conditionne la suite

Statut : `active`

Le prénom est saisi directement dans le titre de l'écran 1 (« Bonjour *[votre
prénom]*, vous en êtes où ? »), dans un champ qui s'élargit avec ce qui est
tapé. Tant qu'il est vide, le bouton de progression reste désactivé.

Raison :

- `User.firstName` est `NOT NULL` : sans prénom, la création de compte de
l'écran final échoue.
- le parcours réutilise le prénom dans les titres suivants (« Alors {prénom},
c'est pour quand ? ») : un parcours sans prénom dégrade toute la copy.

Le prénom est stocké **détouré** : la garde le lit `trim()`, la valeur doit être
persistée de la même façon.

Interdit :

- créer un écran dédié au prénom (la maquette le porte dans le titre de
l'écran 1, pas sur une étape séparée — l'indicateur reste sur 7 étapes)

Couverture attendue :

- `apps/web/app/couple-onboarding/navigation.test.ts` (`canContinue`)

## COUPLE-ONBOARDING-007 — La date et le lieu bloquent l'écran 2

Statut : `active`

`wedding.date` et `wedding.location` sont `NOT NULL`, et l'écran 7 est le seul
moment où quoi que ce soit est écrit : une valeur manquante n'échouerait qu'au
tout dernier écran du parcours. Le bouton CONTINUER de l'écran 2 reste donc
désactivé tant que la date **et** la ville ne sont pas renseignées.

Arbitrage de Denis du 23/08/2026, entre trois options :

- **(a) bloquer l'écran 2** — retenue ;
- (b) rendre les deux colonnes `nullable` comme `zone`/`ambiance`/`ceremonyType`
(voir `COUPLE-ONBOARDING-003`) — écartée ;
- (c) une valeur par défaut côté front — écartée : elle fabriquerait une date et
une ville que le couple n'a jamais données, que Wedmatch relirait comme de
vraies préférences.

Cet arbitrage **renverse** le critère d'acceptance de WED-106 « tous les champs
de l'écran 2 restent modifiables plus tard, aucun ne bloque la progression » :
il ne vaut plus que pour les deux curseurs, qui portent toujours une valeur
(`COUPLE-ONBOARDING-005`). La copy « Pas encore sûrs ? Vous pourrez ajuster plus
tard. » porte sur le budget et reste vraie.

Interdit :

- laisser passer l'écran 2 sans date ni ville
- inventer une valeur par défaut pour l'un des deux champs

Couverture attendue :

- `apps/web/app/couple-onboarding/navigation.test.ts` (`canContinue`)
- `apps/api/tests/Unit/DTO/Couple/RegisterCoupleRequestDtoTest.php` (contraintes
serveur : `sessionStorage` reste réinscriptible)

## COUPLE-ONBOARDING-008 — L'avancement de l'organisation est présélectionné

Statut : `active`

`couple.planning_stage` est `NOT NULL` sans valeur par défaut, et l'écran 1
n'active CONTINUER que sur le prénom. La première pilule (« On vient de
commencer ») est donc **présélectionnée** dès le premier rendu, comme les deux
curseurs de l'écran 2 — plutôt que de rendre la sélection bloquante.

Raison :

- c'est la réponse qu'un couple qui démarre le parcours donnerait ;
- il s'agit d'un défaut de saisie, pas d'un défaut de colonne : le mapping
Doctrine reste sans valeur par défaut (voir `COUPLE-ONBOARDING-002`).

Couverture attendue :

- `apps/web/lib/couple-onboarding-store.test.ts` (`withSliderDefaults`)

## COUPLE-ONBOARDING-009 — L'inscription est email + mot de passe, en un seul appel

Statut : `active`

L'écran 7 crée le compte via `POST /api/v1/register` : email, mot de passe et
confirmation, plancher de 8 caractères — le même que celui de la
réinitialisation de mot de passe, puisque c'est par là que le couple le changera
ensuite. La réponse pose le JWT dans le cookie httpOnly `jwt_token` utilisé par
le reste de la plateforme, et l'écran 8 (thème sombre) accueille le couple sans
autre appel.

Cet endpoint **remplace intégralement** le mécanisme de compte auto-généré à mot
de passe aléatoire envoyé par email (WED-50).

La transaction appartient au service, jamais au contrôleur : voir
`docs/ADR/ADR-006-flush-service-jamais-controller.md`, que ce ticket a fait
sortir de son cas par défaut.

Un email déjà pris répond **409 sur les deux chemins** : le contrôle avant
transaction, et la violation de la contrainte unique `app_user.email` quand deux
inscriptions concurrentes franchissent ce contrôle avant qu'aucune n'ait committé.
Le second cas est un filet, pas une redondance : sans lui la violation remonte en
500, l'`ExceptionListener` ne sachant mapper que `ValidationException`, les
`HttpExceptionInterface` 422 et `\DomainException`. C'est aussi la seule
contrainte d'unicité métier de cette transaction, donc le mapping est sans
ambiguïté (review du 24/08/2026).

Interdit :

- réintroduire un mot de passe généré automatiquement
- créer un second endpoint d'inscription couple
- renvoyer le JWT au frontend autrement que par le cookie httpOnly

Couverture attendue :

- `apps/api/tests/Functional/Auth/RegisterActionTest.php` (doublon d'email :
le critère « aucun compte créé » ne se vérifie vraiment qu'au niveau HTTP)
- `apps/api/tests/Unit/Service/Couple/CoupleRegistrationServiceTest.php`
(consentement, lead, prestataire inactif, doublon d'email concurrent — la
concurrence réelle n'étant pas rejouable au niveau fonctionnel)
- `apps/api/tests/Unit/DTO/Couple/RegisterCoupleRequestDtoTest.php` (mot de passe
trop court, confirmation différente)
