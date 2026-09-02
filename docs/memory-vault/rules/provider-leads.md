# Provider Lead Rules

## PROVIDER-LEAD-001 — Un lead appartient à un couple et cible un prestataire précis

Statut : `active`

Un `ProviderLead` représente une demande de mise en relation créée par un
`Couple` vers un `Vendor` précis. Il ne référence pas `app_user` directement :
les deux profils métier portent les données nécessaires au cycle de vie du lead.

À sa création lors de la finalisation de l'onboarding, le lead est :

- au statut `pending` ;
- d'origine `wedream`.

Le lead ne porte **aucun indicateur de déblocage payant**. Le champ `unlocked`,
posé le 11/08/2026 en attendant l'arbitrage pricing, a été supprimé le
27/08/2026 (WED-130) : le verrouillage pricing des 10-13/08/2026 a rendu le
contact prestataire gratuit à vie — le 99 € ne couvre que le copilote Wedmatch
+ Wedplan + Wedwallet. La visibilité de la fiche couple dépendra de la décision
du prestataire d'accepter ou refuser le lead (Epic 3 / WED-113), jamais d'un
paiement.

Un simple épingle ne crée pas de `ProviderLead` : seule une demande de mise en
relation (« Je veux entrer en contact », WED-49) en produit un. La distinction
porte sur la création du lead, pas sur les écrans du parcours.

Le contexte que le parcours transmet au serveur pour créer ce lead se réduit au
**prestataire ciblé**, revalidé côté serveur (existence et statut actif). Le
libellé du métier affiché au couple pendant le parcours reste dans le navigateur :
il n'est ni transmis ni persisté (review du 24/08/2026 — il était validé côté
backend puis jeté).

Le service visé n'est pas non plus recopié depuis l'écran. WED-131 a eu besoin
de l'afficher et l'a **dérivé de la photo coup de cœur** plutôt que d'ajouter une
colonne : voir `PROVIDER-LEAD-004`.

Depuis WED-131, le lead porte en revanche la **photo coup de cœur**
(`portfolio_image_id`, nullable), qui n'est déductible de rien d'autre.

## PROVIDER-LEAD-002 — Le budget d'un lead est le budget global du mariage, figé à la création

Statut : `active`

Décision produit du 21/08/2026 : l'écran 6 de l'onboarding couple ne demande pas
un budget par prestataire mais **le budget global du mariage**, et il est
présenté à tous les couples quelle que soit la provenance — inscription directe
comme épingle. Tout couple doit pouvoir renseigner son budget.

L'écran 2 continue de proposer les cinq tranches du design source ; l'écran 6
affine cette tranche en un montant exact, en **saisie libre à l'euro près**, sans
pas imposé. Les deux valeurs coexistent dans l'état frontend :

- `budgetCents` — la médiane de la tranche, seule valeur que le curseur de
  l'écran 2 sait représenter ;
- `exactBudgetCents` — le montant tapé à l'écran 6, s'il l'a été.

Le montant porté à `Wedding.budgetCents` et au lead est `exactBudgetCents` quand
il existe, la médiane de la tranche sinon (`weddingBudgetCents()`).

Une saisie **vide ou aberrante** à l'écran 6 — champ laissé vide, `-`, montant
négatif ou nul — ne conserve pas le dernier montant et n'invente pas de plancher :
elle **efface** `exactBudgetCents`, ce qui ramène le budget à la tranche choisie
à l'écran 2 (arbitrage de Denis du 23/08/2026). Un mariage à 0 € ne qualifierait
rien pour un prestataire, et un plancher à 1 € serait un montant que le couple
n'a jamais donné. Le montant reste converti à la sortie du champ, jamais à la
frappe. Écrire le
montant exact dans `budgetCents` renverrait le curseur de l'écran 2 à sa valeur
par défaut, un montant libre n'étant jamais l'une des cinq graduations.

`provider_lead.budget_cents` garde sa **propre copie** du montant plutôt que de
lire `Wedding.budgetCents` à travers le couple : il qualifie la demande telle
qu'elle a été transmise au prestataire, et un couple qui révise son budget plus
tard ne doit pas réécrire silencieusement un lead déjà en cours de traitement.

## PROVIDER-LEAD-003 — Le budget est borné à 1 000 000 €

Statut : `active`

`budget_cents` est un `integer` PostgreSQL, plafonné à 2 147 483 647. Le montant
est saisi librement puis porté par l'état frontend jusqu'à la soumission finale :
il arrive donc côté serveur depuis une source non fiable et doit être borné des
deux côtés.

La borne retenue est `ProviderLead::MAX_BUDGET_CENTS` = `100 000 000` centimes
(1 000 000 €), validée par Wendy le 21/08/2026. C'est un garde-fou technique et
non une règle produit : sans elle, un montant absurde échouerait à l'insertion
au lieu d'être refusé à la saisie.

Un montant hors bornes est refusé par le constructeur de `ProviderLead`. Le DTO
de l'écran final (Stage D / WED-109) doit porter la contrainte `Assert`
équivalente, et revalider le prestataire ciblé — existant et actif — pour
répondre en 422 plutôt qu'en 500. Depuis WED-150, ce prestataire n'est plus
nécessairement désigné par un `vendorId` explicite : voir `PROVIDER-LEAD-006`.

Implémentation actuelle :

- `apps/api/src/Entity/ProviderLead/ProviderLead.php`
- `apps/api/src/Enum/ProviderLead/ProviderLeadStatus.php`
- `apps/api/src/Enum/ProviderLead/ProviderLeadOrigin.php`
- `apps/api/migrations/Version20260819110000.php`
- `apps/web/lib/couple-onboarding-store.ts`
- `apps/web/app/couple-onboarding/navigation.ts`

Couverture attendue :

- test unitaire de l'état de création et des bornes du budget ;
- tests de navigation frontend : écran budget présenté sur les deux chemins,
  retour arrière vers l'écran réellement affiché ;
- E2E lorsque WED-49 et l'écran final d'authentification seront raccordés.

## PROVIDER-LEAD-004 — La photo coup de cœur est portée par le lead, la catégorie en est dérivée

Statut : `active`

Décision du 28/08/2026 (Wendy + Denis, WED-131).

Le parcours de découverte Wedream part d'un sous-style : le couple ouvre
`GET /api/v1/tag-values/{tagValueId}/portfolio-images`, clique sur une photo,
puis demande la mise en relation. La demande de contact transporte donc
`portfolioImageId`, et le lead la persiste (`provider_lead.portfolio_image_id`,
nullable, `ON DELETE SET NULL`). Elle transportait aussi `vendorId` de façon
systématique jusqu'à WED-150 ; ce n'est plus le cas — voir `PROVIDER-LEAD-006`
pour la résolution du prestataire quand `vendorId` est absent.

Deux garde-fous à la création, la valeur venant de l'état client :

- la photo doit appartenir au prestataire ciblé — sinon la fiche dévoilée
  afficherait le travail d'un tiers ;
- la photo doit être publiée dans Wedream (`is_visible_in_wedream`), seule
  galerie où le couple a pu la voir.

Un identifiant qui ne satisfait pas ces conditions est refusé en 422, jamais
ignoré silencieusement : c'est un état client incohérent, pas une absence de
photo. La photo reste facultative — un lead créé avant ce ticket, ou une demande
partie d'un autre point d'entrée, n'en a pas.

**La catégorie de la demande n'est pas stockée.** Elle est dérivée à la lecture :

`portfolio_image` → `portfolio_image_tag` → `tag_value` → `tag_type` (`is_primary`) → `service`

en remontant sur `Service.parent` pour afficher le métier plutôt qu'un
sous-service. La chaîne est fiable parce qu'une photo n'est visible dans Wedream
que si elle porte un tag primaire, et qu'un `tag_type` appartient à exactement
un `service`.

Lire `vendor_service` à la place donnerait une **autre** réponse, et une mauvaise :
la relation est multiple, et elle grandit toute seule quand le prestataire tague
de nouvelles photos (`VendorAutoTaggedService`). La catégorie affichée sur une
demande déjà transmise changerait donc après coup, ce que `PROVIDER-LEAD-002`
refuse pour le budget.

Cas de repli, dans cet ordre :

1. tag primaire de la photo (deux services primaires sur une même photo : tri par
   `sort_order` puis slug, pour que la lecture soit reproductible) ;
2. pas de photo et prestataire mono-service : ce service ;
3. sinon : pas de catégorie, la carte n'en affiche pas.

Contrepartie assumée : la catégorie suit un retag du prestataire. C'est un
libellé d'affichage, pas une donnée contractuelle. Le jour où elle doit être
figée à la demande — apparition dans un email ou un document — il faudra poser
`provider_lead.service_id`.

## PROVIDER-LEAD-005 — Un couple ne voit la fiche prestataire qu'après acceptation

Statut : `active`

`GET /api/v1/couples/me/provider-leads` projette le `ProviderLeadStatus` côté
prestataire sur les trois seuls statuts que le couple voit :

| Couple | ProviderLeadStatus |
|---|---|
| `DEBLOQUEE` | `accepted`, `confirmed`, `contacted` |
| `REFUSEE` | `refused`, `unavailable` |
| `EN_ATTENTE` | `pending`, `closed` |

`Accepted` et `Refused` sont posés par WED-131 : aucune valeur historique
n'exprimait la décision du prestataire, et c'est elle — jamais un paiement — qui
décide de la visibilité de la fiche. Epic 3 (WED-113) les écrira quand
accepter/refuser sortira de pause.

La projection est une **liste blanche** : seule une acceptation explicite dévoile
la fiche. `closed` est trop générique pour être lu comme une acceptation et reste
masqué. Le `match` est exhaustif et sans branche par défaut, et un test parcourt
`ProviderLeadStatus::cases()` : ajouter un statut sans décider ce qu'il montre au
couple casse le test au lieu de tomber dans un défaut silencieux.

Le masquage est porté par la **forme du DTO**, pas par une condition posée plus
loin : `MaskedProviderLeadResponseDto` n'a aucune propriété capable de porter le
nom ou les coordonnées du prestataire. Masqué, le couple voit la catégorie, les
zones d'intervention et sa photo coup de cœur — rien qui identifie quelqu'un.

Implémentation :

- `apps/api/src/Controller/Couple/ProviderLead/GetCoupleProviderLeadsAction.php`
- `apps/api/src/Assembler/Couple/ProviderLead/CoupleProviderLeadResponseDtoAssembler.php`
- `apps/api/src/Enum/Couple/CoupleLeadStatus.php`
- `apps/api/src/Service/ProviderLead/ProviderLeadCategoryResolver.php`
- `apps/api/migrations/Version20260828080000.php`

## PROVIDER-LEAD-006 — Le prestataire ciblé se résout côté serveur, jamais depuis un `vendorId` de confiance

Statut : `active`

Décision verrouillée #1 de WED-49 (29/08/2026, Wendy) : aucun identifiant de
prestataire ne doit transiter côté client, ni en lecture ni en écriture. WED-150
en pose le premier étage côté écriture — la demande de contact de l'écran final
d'onboarding (Stage D / WED-109, `PostRegisterAction`).

`ProviderContactRequestDto::$vendorId` devient nullable. Le couple cible
toujours une photo précise avant de demander le contact ; le prestataire n'a
donc jamais besoin d'être désigné explicitement, puisque
`CoupleRegistrationService` sait déjà le remonter depuis
`portfolio_image.vendor_id` — c'est exactement ce que fait `PROVIDER-LEAD-004`
pour la validation d'appartenance de la photo.

`resolveActiveVendor()` accepte les deux chemins :

- `vendorId` présent → comportement historique inchangé (lookup + statut
  `active`, sinon 422) ;
- `vendorId` absent → le vendor est dérivé de `portfolioImageId` via
  `findVisiblePortfolioImage()->getVendor()`.

Le contrôle de statut `active` s'applique **aux deux chemins**, pas seulement au
premier. `is_visible_in_wedream` est recalculé au tagging de la photo, pas à
chaque changement de statut du prestataire (voir `WEDREAM-VISIBILITY-001/002`) :
une photo encore taguée visible ne dit rien de la disponibilité actuelle de son
propriétaire. Sans ce contrôle sur le second chemin, un prestataire désactivé
resterait joignable via une vieille photo.

Au moins un des deux identifiants reste obligatoire — une demande de contact
sans aucune cible n'a pas de sens. La contrainte est portée par le DTO
(`#[Assert\Callback]` sur la classe, violation rattachée à `vendorId` pour que
le frontend ait un chemin d'affichage) et revérifiée dans le service, qui reste
appelable sans passer par `MapRequestPayload`.

`vendorId` reste accepté aujourd'hui : le frontend de l'écran 7 continue de
l'envoyer systématiquement (`couple-registration.ts`), la bascule complète est
hors scope de WED-150. Elle est prévue pour US2 (couple déjà connecté qui
épingle/contacte une nouvelle photo sans repasser par l'onboarding) et US3a —
seul un couple déjà authentifié n'aura alors plus de raison d'envoyer autre
chose qu'un `portfolioImageId`. Tant que ces deux US ne sont pas livrées,
`vendorId` ne doit pas être retiré du DTO : l'endpoint `POST /api/v1/register`
reste son seul point d'entrée (aucun autre controller ne consomme
`ProviderContactRequestDto`) et le frontend actuel dépend encore de son envoi.

Implémentation :

- `apps/api/src/DTO/Couple/ProviderContactRequestDto.php`
- `apps/api/src/Service/Couple/CoupleRegistrationService.php` (`resolveActiveVendor`, `findVisiblePortfolioImage`)

Couverture :

- `apps/api/tests/Unit/Service/Couple/CoupleRegistrationServiceTest.php` — résolution
  depuis la photo seule, photo non visible dans Wedream, photo visible d'un
  vendor inactif, absence totale de cible ;
- `apps/api/tests/Unit/DTO/Couple/RegisterCoupleRequestDtoTest.php` — validation
  DTO sur les mêmes cas limites (photo seule acceptée, aucune cible rejetée).

À auditer : quand US2/US3a seront livrées et que le frontend n'enverra plus
`vendorId` du tout, revenir ici pour décider si le champ doit rester nullable
en confort de compatibilité descendante ou être retiré du DTO.

## PROVIDER-LEAD-007 — Un seul lead par couple et par prestataire, premier arrivé gagne

Statut : `active`

Décision verrouillée #3 de WED-49, livrée par WED-152. Le parcours Wedream
accumule les coups de cœur avant l'inscription : le couple peut demander le
contact depuis deux photos différentes du même prestataire sans jamais voir
qu'il s'agit du même. C'est un geste légitime côté couple, pas une erreur à lui
renvoyer — mais deux mises en relation identiques côté prestataire n'ont aucun
sens.

La liste `contactRequests` est donc dédoublonnée **par prestataire résolu côté
serveur**, jamais par un identifiant venu du client (PROVIDER-LEAD-006). La
première demande du tableau vers un prestataire donné crée le lead, avec **sa**
photo coup de cœur ; les suivantes vers ce même prestataire sont ignorées en
silence, sans exception ni log d'erreur. Le prestataire voit donc la photo qui a
déclenché le premier geste, pas la dernière cliquée.

L'index unique `UNIQ_provider_lead_couple_vendor` sur `provider_lead
(couple_id, vendor_id)` double la règle en base — même patron que
`UNIQ_couple_pin_couple_image` sur les épinglés. Le dédoublonnage applicatif
couvre le parcours nominal, l'index couvre les demandes concurrentes.

Les photos épinglées (`pins`) ne sont **pas** dédoublonnées applicativement :
non spécifié par le produit, et la contrainte unique de `couple_pin` reste seule
juge.

Dette assumée, tracée par un TODO dans `CoupleRegistrationService` : le
`catch (UniqueConstraintViolationException)` de l'inscription suppose encore une
seule contrainte unique possible (l'email) et répond 409 « email déjà utilisé ».
Un doublon dans `pins` violerait `UNIQ_couple_pin_couple_image` et serait
incorrectement mappé sur ce message. Non bloquant — il faut un bug frontend ou
une course pour y arriver — à traiter si ça remonte en production.

Autre dette assumée, également tracée par un TODO : `contactRequest` (singulier)
survit à côté de `contactRequests` comme shim de compatibilité descendante. Le
retirer avant que le frontend n'envoie `contactRequests`/`pins` ferait perdre
toutes les demandes de contact **en silence** — la clé serait simplement ignorée
à la dénormalisation, sans 422 pour le signaler. Le tableau prime dès qu'il
porte quelque chose ; l'ancien champ ne sert que s'il est vide.

Implémentation :

- `apps/api/src/DTO/Couple/RegisterCoupleRequestDto.php`
- `apps/api/src/Service/Couple/CoupleRegistrationService.php`
- `apps/api/src/Entity/ProviderLead/ProviderLead.php`
- `apps/api/migrations/Version20260830091529.php`

À auditer : au moment du switch frontend, retirer le shim `contactRequest` et
les deux tests qui le couvrent, puis revenir sur le mapping du catch.

---

## PROVIDER-LEAD-008 — Recontacter dit où en est la demande, et un refus est définitif

Statut : `active`

Livré par WED-186. Recontacter un prestataire déjà en lead reste le no-op
silencieux de `PROVIDER-LEAD-007`, mais il n'est plus muet : `POST
/api/v1/couples/me/provider-leads` renvoie le `CoupleLeadStatus` du lead
réellement en base, en plus du code HTTP.

Le code seul ne suffisait pas. 201 et 200 disent « une ressource est née » ou
« elle existait déjà » — pas si le prestataire a répondu. Un couple recliquant
sur une photo relisait donc « Demande envoyée » alors que le prestataire venait
de refuser : le même texte pour trois situations qu'il ne vit pas de la même
façon.

Le statut est **projeté à la lecture** (`PROVIDER-LEAD-005`), jamais persisté
côté couple. La branche concurrente relit la ligne gagnante avant de répondre :
la requête qui perd la course contre `UNIQ_provider_lead_couple_vendor` n'a
aucune raison de savoir ce que l'autre a écrit, et supposer « en attente » y
serait faux dès que WED-113 posera des décisions.

**Un refus est définitif.** Aucun mécanisme de recontact n'est offert depuis ce
bouton : le couple est renvoyé vers d'autres profils. Rouvrir une fenêtre de
recontact après refus est une question produit distincte, explicitement hors
scope de WED-186 — la trancher avant de rendre le geste à nouveau disponible.

Conséquence côté lecture : `GET /provider-leads` porte déjà ce statut
(`PROVIDER-LEAD-005`), et la galerie s'en sert dès le rendu serveur. Un statut
connu pour une photo n'est jamais redemandé au réseau — le clic ne fait que
raffiner ce que la lecture initiale n'avait pas.

Implémentation :

- `apps/api/src/Service/Couple/ProviderLead/CreateCoupleProviderLeadResult.php`
- `apps/api/src/Service/Couple/ProviderLead/CreateCoupleProviderLeadService.php`
- `apps/api/src/Controller/Couple/ProviderLead/CreateCoupleProviderLeadAction.php`

À auditer : quand WED-113 sortira de pause, vérifier sur des leads réellement
acceptés/refusés — tant qu'il est en pause, seul `EN_ATTENTE` existe en base et
les deux autres branches ne sont couvertes que par les tests.
