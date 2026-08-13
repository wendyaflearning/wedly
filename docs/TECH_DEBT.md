# Dette technique

Registre des raccourcis assumés en connaissance de cause, avec le seuil qui déclenche le remboursement.

## GetVendorDashboardPortfolioAction — N+1 potentiel sur les tags

- **Dette** : N+1 potentiel sur `GetVendorDashboardPortfolioAction` (styles/specialties lazy-loaded par image, une requête par relation à chaque image bouclée)
- **Seuil de déclenchement** : si un vendor dépasse ~20 photos en prod, ou alerte Sentry sur cette route
- **Remède** : eager loading (`JOIN FETCH` ou `EAGER` sur les relations) quand le seuil est atteint

## tag_type — faux positif permanent sur doctrine:schema:validate (WED-97)

- **Contexte** : index unique partiel `UNIQ_TAG_TYPE_SERVICE_PRIMARY` sur `tag_type(service_id) WHERE (is_primary = true)`, ajouté à la main dans la migration `Version20260803142800`. Doctrine ORM ne sait pas exprimer un index partiel (`WHERE`) via ses attributs, donc ce garde-fou métier (un seul `TagType` primaire actif par service) n'a pas d'équivalent dans le mapping d'entité.
- **Conséquence** : `doctrine:schema:validate` affichera en permanence `DROP INDEX uniq_tag_type_service_primary` comme diff. Idem pour tout futur `doctrine:migrations:diff` touchant `tag_type` : Doctrine proposera de le supprimer puisqu'il ne le connaît pas.
- **Consigne** : ne **jamais** appliquer ce DROP proposé par `schema:validate` ou par un `migrations:diff` sur cette table — c'est un garde-fou métier volontaire, pas une erreur de mapping.
- **Statut** : dette assumée, pas de remboursement prévu — limitation native de Doctrine ORM (pas d'index partiel), pas un raccourci qu'on compte combler.

## PortfolioPageClient — tagTypes résolus via le premier service du vendor (vendorServices[0])

- **Dette** : un vendor multi-services (freelance avec plusieurs métiers) ne peut taguer ses photos que selon la taxonomie de son premier service déclaré (`vendorServices[0]`) — pas de sélection de métier dans l'écran de tagging du dashboard.
- **Contexte** : simplification MVP actée pour WED-103 (tagging portfolio côté prestataire). La majorité des vendors n'ont qu'un seul service ; gérer le multi-service en V1 aurait ajouté une étape de sélection de métier non prévue dans le ticket.
- **Seuil de déclenchement** : retours terrain de vendors multi-services bloqués sur le tagging d'un second métier.
- **Remède** : ajouter un sélecteur de service dans l'écran de tagging du dashboard, ou reprendre `vendorServices` en entier au lieu du seul premier élément.

## flush() dans le Controller au lieu du Service (pré-ADR-006)

- **Dette** : 20 Actions flushent directement (`$this->em->flush()`
ou `$this->entityManager->flush()`) au lieu de déléguer au service
métier, en violation de la règle actée dans ADR-006 (flush() = 
responsabilité du service, jamais du controller).
- **Contexte** : deux sous-cas, sévérité différente.
   1. Legacy `extends AbstractController`, logique métier inline sans
    service dédié — le flush est un symptôme d'un problème plus
    large (pas de couche service du tout), pas juste un flush mal
    placé.
   2. Single Action Controller récent qui délègue déjà la logique à
    un service, mais garde le flush à l'extérieur — ici le fix est
    mineur (déplacer une ligne).
- **Seuil de déclenchement** : au prochain refactor ou bug touchant
un de ces fichiers — pas de remboursement proactif planifié, dette
corrigée au fil de l'eau.
- **Remède** : déplacer `flush()` dans le service correspondant (ou
créer un service dédié pour le cas 1 si absent).
- **Fichiers concernés — cas 1, legacy AbstractController, pas de
service dédié** :
   - apps/api/src/Controller/Vendor/Consent/PostVendorConsentAction.php
   - apps/api/src/Controller/Vendor/MatchingConsent/PostVendorMatchingConsentAction.php
   - apps/api/src/Controller/Vendor/Onboarding/DeleteVendorOnboardingPortfolioAction.php
   - apps/api/src/Controller/Vendor/Settings/PatchVendorPasswordAction.php
   - apps/api/src/Controller/Vendor/Settings/PatchVendorSettingsAction.php
   - apps/api/src/Controller/Vendor/CateringCharacteristics/PatchVendorCateringCharacteristicsAction.php
   - apps/api/src/Controller/Vendor/VenueCharacteristics/PatchVendorVenueCharacteristicsAction.php
   - apps/api/src/Controller/Vendor/Experiences/PatchVendorExperiencesAction.php
   - apps/api/src/Controller/Vendor/LegalInfo/PatchVendorLegalInfoAction.php
   - apps/api/src/Controller/Vendor/Dashboard/Portfolio/PatchVendorDashboardPortfolioCoverAction.php
   - apps/api/src/Controller/Vendor/Dashboard/Portfolio/PostVendorDashboardPortfolioAction.php
   - apps/api/src/Controller/Vendor/Dashboard/Portfolio/DeleteVendorDashboardPortfolioAction.php
   - apps/api/src/Controller/Vendor/PricingZone/PatchVendorPricingZoneAction.php
   - apps/api/src/Controller/Vendor/PatchBioAction.php
   - apps/api/src/Controller/Admin/Vendor/Portfolio/PatchVendorPortfolioTagsAction.php
   - apps/api/src/Controller/Admin/Vendor/Portfolio/DeleteVendorPortfolioAction.php
   - apps/api/src/Controller/Admin/Vendor/Portfolio/PostUploadVendorPortfolioAction.php
   - apps/api/src/Controller/Auth/PostResetPasswordAction.php
   - apps/api/src/Controller/Auth/PostForgotPasswordAction.php
- **Fichiers concernés — cas 2, service déjà présent, flush juste mal
placé** :
   - apps/api/src/Controller/Vendor/Dashboard/Portfolio/PatchVendorDashboardPortfolioTagsAction.php
