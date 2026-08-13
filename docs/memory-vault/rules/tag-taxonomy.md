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
