# Tag Taxonomy (Admin)

## Scope

Règles liées à la gestion admin de la taxonomie de tags (catégories
TagType et valeurs TagValue) utilisée pour le tagging des photos
portfolio prestataire.

Code principal :

- `apps/api/src/Service/Vendor/AdminTagTypeService.php`
- `apps/api/src/Repository/Vendor/TagTypeRepository.php`

Tests existants :

- `apps/api/tests/Unit/Vendor/AdminTagTypeServiceTest.php`

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
