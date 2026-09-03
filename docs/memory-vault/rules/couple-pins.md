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

## COUPLE-PIN-004 — Épingler est un geste idempotent, jamais une erreur

Statut : `active`

Décision verrouillée #4 de WED-49, implémentée par `POST /api/v1/couples/me/pins`
(WED-155).

Le couple connecté épingle en n'envoyant que `portfolioImageId` : le prestataire
est déduit côté serveur (aucun `vendorId` ne transite, décision #1 de WED-49) et
le couple est lu dans le JWT, jamais dans l'URL ni dans le corps.

Règles d'écriture :

- la photo doit être publiée dans Wedream au moment de l'épinglage — les trois
  conditions de WEDREAM-VISIBILITY-003 ensemble (fiche publiée, vitrine Wedream
  active, photo taguée visible), même porte que le parcours d'inscription
  (`VendorResolver::findVisiblePortfolioImage()`), sinon 422. Depuis WED-193
  cette porte est exactement la même que la lecture (COUPLE-PIN-003) : aucune
  ligne `couple_pin` ne peut naître invisible ;
- réépingler une photo déjà épinglée par ce couple est un **no-op silencieux**,
  pas un conflit : côté couple le cœur est déjà rempli, un 409 ne lui donnerait
  rien à corriger. `UNIQ_couple_pin_couple_image` (COUPLE-PIN-001) reste le
  filet contre les requêtes concurrentes ;
- un compte prestataire est refusé par le contrôle de rôle générique, sans
  message spécifique (décision #2 de WED-49).

**Why:** le geste « coup de cœur » doit rester sans friction — le couple tape sur
un cœur, il n'a aucune notion de création de ressource ni de doublon.

**How to apply:** toute future écriture d'épinglé (suppression, épinglage en
lot, réépinglage depuis un autre parcours) reste idempotente et valide la
visibilité Wedream de la photo au moment de l'écriture, pas à l'affichage.

## COUPLE-PIN-005 — Dé-épingler désactive la ligne, et réépingler la ressuscite

Statut : `active`

Décision produit du 31/08/2026 (WED-183) : le cœur devient un vrai toggle. Un
couple doit pouvoir se rétracter d'un coup de cœur sans quitter la galerie.

`DELETE /api/v1/couples/me/pins/{portfolioImageId}` ne supprime pas la ligne :
il passe `couple_pin.is_active` à `false`. `UNIQ_couple_pin_couple_image`
(COUPLE-PIN-001) n'autorise qu'une ligne par couple et par photo pour toujours,
donc un réépinglage réactive **cette** ligne au lieu d'en insérer une seconde.

Règles :

- le geste est idempotent dans les trois états de départ — pin actif, pin déjà
  désactivé, photo jamais épinglée : toujours 204, jamais 404. L'interface
  rejoue volontiers un DELETE après un retour réseau incertain ;
- aucun contrôle de visibilité Wedream au dé-épinglage, contrairement à
  l'épinglage (COUPLE-PIN-004) : un prestataire qui quitte Wedream ne doit pas
  bloquer le cœur du couple en position remplie ;
- un pin désactivé disparaît de toutes les lectures (COUPLE-PIN-002 et la
  lecture SSR de la galerie), qui partagent le même filtre `is_active = true` ;
- le couple vient du JWT, la photo de l'URL : un compte ne dé-épingle que pour
  lui-même.

**Why:** un coup de cœur est un geste léger et réversible, pas un engagement —
un clic accidentel doit se corriger d'un second clic, sans support ni
formulaire. La désactivation plutôt que la suppression garde l'historique du
geste et évite de rejouer un INSERT contre la contrainte unique.

**How to apply:** toute nouvelle lecture d'épinglés filtre `is_active = true` ;
toute nouvelle écriture passe par `CouplePin::reactivate()` /
`deactivate()`, jamais par un `setIsActive(bool)` (patron canonique de soft
delete, ADR-006).

### Côté galerie — le geste non encore synchronisé se retire en local

Un épinglage posé sans compte n'est jamais parti au backend : il attend
l'inscription dans la file locale (WED-160). Le dé-épingler ne déclenche donc
**aucun appel réseau** — il sort de la file, et c'est tout. Un DELETE serait
refusé faute de session, et l'entrée resterait en file pour être rejouée à
l'inscription alors que le couple s'est justement rétracté.

Le cœur n'est vidé à l'écran que sur un retrait réellement acquis : file purgée,
ou 204 du backend. Une session expirée en cours de route laisse le cœur rempli —
l'épinglé l'est toujours en base, prétendre le contraire ferait croire au couple
qu'il s'est rétracté.

## COUPLE-PIN-006 — La grille des épinglés est une vitrine, jamais une porte

Statut : `active`

Zone « Épinglés » de Mon espace Wedly (US-6.6 / WED-135).

La grille affiche **toutes** les photos épinglées : l'épinglage est gratuit et
sans limite de nombre — aucun quota, aucune pagination, aucun CTA payant.

Aucune vignette ne mène ailleurs : ni lien, ni ouverture de fiche. Le masquage
tient à deux verrous cumulés — la forme du DTO, qui ne peut pas porter d'identité
prestataire (COUPLE-PIN-002), et l'absence de tout geste sortant.

Le seul geste ouvert sur une vignette est le retrait de son propre épinglé
(décision produit du 03/09/2026 — le geste était hors scope de WED-135 comme de
WED-183, la zone a été rouverte pour l'accueillir) :

- il est **confirmé sur la vignette** avant d'être envoyé. Le cœur de la galerie
  se contente de se vider, ici la photo quitte la liste : à l'échelle d'un
  carnet, le geste mérite une seconde intention ;
- la vignette ne part de l'écran que sur un 204 acquis, jamais par anticipation
  (même règle que la galerie, COUPLE-PIN-005). Session expirée ou panne : la
  photo reste, un message explique — la prétendre retirée ferait croire au couple
  qu'il s'est rétracté ;
- il ne dévoile toujours rien. Retirer un épinglé agit sur les données du couple,
  pas sur celles du prestataire : l'invariante protégée par cette règle est
  intacte.

Implémentation :

- `apps/web/app/mon-espace/epingles/page.tsx`
- `apps/web/components/couple/pins/PinnedPhotosZone.tsx` (état de la liste)
- `apps/web/components/couple/pins/PinnedPhotoCard.tsx` (vignette + confirmation)
- `apps/web/lib/couple-pins.ts` · `apps/web/lib/couple-pins.server.ts`
- `apps/web/lib/wedream-cta.ts` (`submitUnpinAction`, partagé avec la galerie)

**Why:** l'épinglé est un carnet d'inspiration, pas un canal de mise en relation
— seule la demande de contact (PROVIDER-LEAD-001) ouvre l'accès au prestataire,
et elle passe par son accord explicite. Et un carnet se tient à jour là où on le
consulte : renvoyer le couple dans la galerie pour retirer une photo, c'est lui
demander de gérer sa liste ailleurs que là où elle existe.

**How to apply:** toute évolution de la zone (tri, regroupement, partage) garde
la grille muette sur l'identité prestataire — ajouter un lien sortant vers une
fiche est un choix de revue visible, pas un détail d'implémentation. Les
écritures, elles, restent bornées aux données du couple, et confirmées dès
qu'elles retirent quelque chose de l'écran.
