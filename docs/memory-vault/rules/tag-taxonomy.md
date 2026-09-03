# Tag Taxonomy (Admin)

## Scope

Règles liées à la gestion admin de la taxonomie de tags (catégories
TagType et valeurs TagValue) utilisée pour le tagging des photos
portfolio prestataire.

Code principal :

- `apps/api/src/Service/Vendor/AdminTagTypeService.php`
- `apps/api/src/Repository/Vendor/TagTypeRepository.php`
- `apps/api/src/Service/Vendor/AdminTagValueService.php`
- `apps/api/src/Repository/Vendor/TagValueRepository.php`

Tests existants :

- `apps/api/tests/Unit/Vendor/AdminTagTypeServiceTest.php`
- `apps/api/tests/Unit/Vendor/AdminTagValueServiceTest.php`

## TAG-TAXONOMY-001 — Une seule catégorie principale active par métier

Statut : `active`

Un `TagType` avec `isPrimary=true` ne peut être créé pour un
`serviceId` si un autre `TagType` `isPrimary=true` ET `isActive=true`
existe déjà pour ce même service.

Raison produit :

- garantir qu'un seul axe de tag agit comme classement principal par
métier

Implémentation actuelle :

- `AdminTagTypeService::create()`
- `TagTypeRepository::findOneActivePrimaryByService()`
- Garde-fou DB en doublon de la vérification applicative : index
unique partiel `UNIQ_TAG_TYPE_SERVICE_PRIMARY` sur
`tag_type(service_id) WHERE (is_primary = true)` (migration
`Version20260803142800`, cf. TECH_DEBT.md pour le faux positif
`doctrine:schema:validate` associé)

Contrat attendu :

- tentative de création en conflit : exception domaine `422`, message
"Une catégorie principale existe déjà pour ce métier. Désactive-la
d'abord ou décoche."

Couverture attendue :

- `AdminTagTypeServiceTest::test_create_throws_422_when_active_primary_already_exists`

## TAG-TAXONOMY-002 — Désactivation sans cascade, jamais de suppression réelle

Statut : `active`

Désactiver un `TagType` passe `is_active` à `false` (soft delete),
idempotent. Aucune suppression réelle n'est jamais effectuée. La
désactivation ne cascade pas sur les `TagValue` enfants — ils restent
en base, simplement plus proposés côté lecture puisque leur parent
est inactif.

Raison produit :

- préserver l'historique de tagging sur les photos déjà taguées
- scope volontairement limité pour cette US (cascade hors scope)

Implémentation actuelle :

- `AdminTagTypeService::deactivate()`

Contrat attendu :

- désactivation d'un TagType déjà inactif : idempotent, 200, aucune
écriture supplémentaire
- désactivation d'un TagType actif : `is_active=false`, TagValue
enfants non touchés

Couverture attendue :

- `AdminTagTypeServiceTest::test_deactivate_is_idempotent_and_does_not_touch_tag_values`

## TAG-TAXONOMY-003 — Unicité du label par catégorie, insensible à la casse

Statut : `active`

Un `TagValue` ne peut être créé ou renommé avec un `label` qui existe
déjà (à la casse près) pour le même `tagTypeId`, actif ou inactif.

Raison produit :

- éviter les doublons visuellement identiques dans le moodboard
(ex : "Rustique" et "rustique")

Implémentation actuelle :

- `AdminTagValueService::create()` / `update()`
- `TagValueRepository::findOneByLabelAndTagType()` — comparaison
`LOWER()`, exclut l'id courant en édition

Contrat attendu :

- tentative de création/édition en conflit : exception domaine `409`,
message "Ce tag existe déjà pour cette catégorie."

Couverture attendue :

- `AdminTagValueServiceTest::test_create_throws_409_when_label_already_exists_for_tag_type`
- `AdminTagValueServiceTest::test_create_throws_409_when_label_differs_only_by_case`
- `AdminTagValueServiceTest::test_update_throws_409_when_label_collides_with_another_tag_value`
- `AdminTagValueServiceTest::test_update_throws_409_when_label_differs_only_by_case_from_another_value`
- `AdminTagValueServiceTest::test_update_with_same_label_as_self_does_not_throw`

## TAG-TAXONOMY-004 — Un TagValue ne peut être créé sous une catégorie inactive

Statut : `active`

La création d'un `TagValue` échoue si le `TagType` parent n'existe pas
ou n'est pas actif.

Raison produit :

- empêcher d'enrichir une catégorie qu'un admin a volontairement
désactivée

Implémentation actuelle :

- `AdminTagValueService::create()`

Contrat attendu :

- `TagType` introuvable ou inactif : exception domaine `404`, message
"Catégorie de tag introuvable."

Couverture attendue :

- `AdminTagValueServiceTest::test_create_throws_404_when_tag_type_not_found`
- `AdminTagValueServiceTest::test_create_throws_404_when_tag_type_inactive`

## TAG-TAXONOMY-005 — Désactivation sans cascade sur portfolio_image_tag

Statut : `active`

Désactiver un `TagValue` passe `is_active` à `false` (soft delete),
idempotent. Les photos déjà taguées avec ce `TagValue` conservent
l'association en base (`portfolio_image_tag` n'est jamais touché).

Raison produit :

- préserver l'historique de tagging existant sur les photos déjà
publiées

Implémentation actuelle :

- `AdminTagValueService::deactivate()`

Contrat attendu :

- désactivation d'un TagValue déjà inactif : idempotent, 200, aucune
écriture supplémentaire
- désactivation d'un TagValue actif : `is_active=false`,
`portfolio_image_tag` non touché

Couverture attendue :

- `AdminTagValueServiceTest::test_deactivate_is_idempotent`
- Vérification manuelle Insomnia : photo déjà taguée garde le tag
après désactivation

## TAG-TAXONOMY-006 — Catégorie principale non désactivable

Statut : `active`

Un `TagType` avec `isPrimary=true` ne peut pas être désactivé, ni via
l'API ni depuis l'écran admin.

Raison produit :

- l'index unique partiel `UNIQ_TAG_TYPE_SERVICE_PRIMARY` (cf.
TAG-TAXONOMY-001) n'est pas filtré par `is_active`, alors que
`findOneActivePrimaryByService` ne regarde que les lignes actives —
désactiver une principale la laissait `isPrimary=true` + inactive,
invisible au contrôle applicatif mais toujours en conflit avec la
contrainte DB brute (500 au lieu d'un 422 propre)
- combiné à l'immuabilité de `isPrimary` après création, ça créait un
état sans chemin de récupération via l'API

Implémentation actuelle :

- `AdminTagTypeService::deactivate()` — garde en tête de méthode
- `TaxonomyDetailClient.tsx` — `canDeactivate={!tagType.isPrimary}`
passé au `KebabMenu`, masque l'option "Désactiver" côté UI en plus du
garde backend

Contrat attendu :

- tentative de désactivation d'une catégorie principale : exception
domaine `422`, message "Cette catégorie est la catégorie principale
de ce métier et ne peut pas être désactivée."

Couverture attendue :

- `AdminTagTypeServiceTest::test_deactivate_throws_422_when_tag_type_is_primary`

## TAG-TAXONOMY-007 — Réactivation de TagType et TagValue

Statut : `active`

Un `TagType` ou une `TagValue` désactivé·e peut être réactivé·e via un
endpoint dédié, idempotent comme `deactivate()`.

Raison produit :

- avant cette règle, la désactivation était définitive côté API
(aucun champ `isActive` dans les DTO de update, aucun endpoint
retour) — une erreur de manipulation admin n'avait pas de chemin de
récupération

Implémentation actuelle :

- `AdminTagTypeService::activate()` / `AdminTagValueService::activate()`
- `ActivateTagTypeAction` (`PATCH /api/v1/admin/tag-types/{id}/activate`)
- `ActivateTagValueAction` (`PATCH /api/v1/admin/tag-values/{id}/activate`)
- `KebabMenu.tsx` — action "Réactiver" affichée à la place de
"Désactiver" quand `isActive` est faux, sans popover de confirmation
(action non destructive)

Contrat attendu :

- réactivation idempotente : aucune écriture si déjà actif
- réactiver ne touche jamais `isPrimary`

Couverture attendue :

- `AdminTagTypeServiceTest::test_activate_reactivates_inactive_tag_type`
- `AdminTagTypeServiceTest::test_activate_is_idempotent`
- `AdminTagValueServiceTest::test_activate_reactivates_inactive_tag_value`
- `AdminTagValueServiceTest::test_activate_is_idempotent`
