# Wedream Visibility

## Scope

Règles liées à la publication d'un prestataire et de ses photos dans la galerie
publique Wedream.

Code principal :

- `apps/api/src/Entity/Vendor/Vendor.php` (`wedreamEnabled`)
- `apps/api/src/Service/Vendor/VendorWedreamVisibilityService.php`
- `apps/api/src/Controller/Vendor/Dashboard/PatchVendorDashboardWedreamVisibilityAction.php`
- `apps/api/src/Repository/Vendor/PortfolioImageRepository.php`

## WEDREAM-VISIBILITY-001 — La publication publique exige un opt-in explicite du prestataire

Statut : `active`

Taguer une photo ne publie plus le prestataire. Une photo n'apparaît dans la
galerie publique que si les trois conditions sont vraies ensemble :
`vendor.is_published`, `vendor.wedream_enabled` et
`portfolio_image.is_visible_in_wedream`.

Raison produit :

- le tagging positionne `is_visible_in_wedream = true` automatiquement ; sans
flag vendeur séparé, taguer revenait à publier sans confirmation ni retour
arrière possible

Implémentation actuelle :

- `PortfolioImageRepository::findPublicByTagValue()`
- `PortfolioImageRepository::countByTagValue()`

Contrat attendu :

- par défaut `wedream_enabled = false`, y compris pour les comptes créés avant
la migration : un prestataire n'est jamais publié sans action explicite
- toute nouvelle requête de lecture publique de la galerie doit reprendre les
trois conditions, pas seulement le flag par photo

Risque de régression :

- ajouter une méthode de lecture publique en ne filtrant que sur
`is_visible_in_wedream` republierait silencieusement des prestataires opt-out

## WEDREAM-VISIBILITY-002 — La désactivation coupe la lecture publique, jamais la donnée

Statut : `active`

Désactiver la visibilité ne touche ni les `PortfolioImage`, ni leurs tags, ni
`is_visible_in_wedream`. Seule la lecture publique est coupée, et une
réactivation restitue l'état exact d'avant.

Raison produit :

- le prestataire doit pouvoir se retirer de la galerie sans perdre le travail de
tagging déjà fait, et revenir sans le refaire

Implémentation actuelle :

- `VendorWedreamVisibilityService::setVisibility()`

Contrat attendu :

- `PATCH /api/v1/vendors/me/wedream-visibility` avec `enabled=false` : seul
`vendor.wedream_enabled` change
- aucune écriture sur `portfolio_image` ni `portfolio_image_tag`

Couverture existante :

- `tests/Unit/Vendor/VendorWedreamVisibilityServiceTest.php`
- `tests/Unit/Controller/Vendor/Dashboard/PatchVendorDashboardWedreamVisibilityActionTest.php`

E2E attendu :

- prestataire publié : activer la visibilité, vérifier l'apparition dans la
galerie, désactiver, vérifier la disparition puis la réapparition après
réactivation sans re-tagging
