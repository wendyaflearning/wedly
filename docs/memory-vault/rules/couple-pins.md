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
