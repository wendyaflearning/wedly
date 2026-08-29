# Couple pins

## COUPLE-PIN-001 — Un épinglé relie un couple à une photo de portfolio

Statut : `active`

Un `CouplePin` représente une photo que le couple a épinglée depuis la galerie
Wedream. Il relie un `Couple` à un `PortfolioImage` précis.

Contraintes :

- un couple ne peut épingler qu'une fois la même photo (`UNIQ_couple_pin_couple_image`) ;
- la suppression du couple ou de la photo supprime l'épinglé (`ON DELETE CASCADE`).

Un simple épingle ne crée pas de `ProviderLead` : seule une demande de mise en
relation en produit un (PROVIDER-LEAD-001). L'écriture de l'épinglé vit dans
WED-49 ; ce ticket ne couvre que la lecture.

## COUPLE-PIN-002 — Le couple ne voit que l'image, jamais le prestataire

Statut : `active`

`GET /api/v1/couples/me/pins` projette chaque épinglé sur un DTO minimal :

- `id` — identifiant de l'épinglé ;
- `portfolioImageId` — identifiant de la photo (déjà public dans la galerie
  Wedream, nécessaire au front pour marquer les photos déjà épinglées) ;
- `photoUrl` — URL de la photo ;
- `pinnedAt` — date d'épinglage.

Le masquage tient dans la **forme du DTO** : `CouplePinResponseDto` n'a aucune
propriété capable de porter le nom ou les coordonnées du prestataire. Le couple
lu est toujours celui du JWT : aucun identifiant de couple ne transite par
l'URL.

Implémentation :

- `apps/api/src/Controller/Couple/Pin/GetCouplePinsAction.php`
- `apps/api/src/Assembler/Couple/Pin/CouplePinResponseDtoAssembler.php`
- `apps/api/src/Entity/Couple/CouplePin.php`
- `apps/api/migrations/Version20260828174902.php`

Couverture attendue :

- test unitaire de l'assembler (fuite d'identité prestataire) ;
- test fonctionnel de la réponse HTTP, de l'isolation entre couples et des accès
  refusés (401/403).

## COUPLE-PIN-003 — Un épinglé n'est lisible que tant que la photo reste Wedream-visible

Statut : `active`

Décision produit du 28/08/2026 (reprise QA WED-132).

`GET /api/v1/couples/me/pins` ne renvoie un épinglé que si les trois conditions
de publication Wedream sont vraies ensemble — les mêmes que
`PortfolioImageRepository::findPublicByTagValue()` (WEDREAM-VISIBILITY-001) :

- `vendor.is_published` ;
- `vendor.wedream_enabled` ;
- `portfolio_image.is_visible_in_wedream`.

Un prestataire qui se retire de Wedream (ou qu'un admin dépublie) ne voit plus
sa photo servie dans l'espace couple, même si la ligne `couple_pin` existe
encore. Une réactivation Wedream restitue l'épinglé sans action du couple
(WEDREAM-VISIBILITY-002).

L'ordre affiché est « plus récent d'abord », porté par `couple_pin.id DESC`
(UUIDv7 chronologique), pas par `created_at` seul (précision seconde).
