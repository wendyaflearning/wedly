# RGPD Consent

## Scope

Règles liées au consentement explicite avant la collecte de données sensibles
utilisées dans le matching, côté prestataire comme côté couple.

Code principal :

- `apps/api/src/Entity/Vendor/VendorConsent.php`
- `apps/api/src/Enum/Vendor/ConsentType.php`
- `apps/api/src/DTO/Vendor/Onboarding/ConsentStepRequestDto.php`
- `apps/api/src/Handler/Vendor/Onboarding/ConsentStepHandler.php`
- `apps/api/src/Handler/Vendor/Onboarding/ExperiencesStepHandler.php`
- `apps/api/src/Dispatcher/Vendor/Onboarding/VendorOnboardingStepDispatcher.php`
- `apps/api/src/Builder/Vendor/Onboarding/VendorOnboardingOverviewBuilder.php`
- `apps/api/src/Controller/Vendor/Consent/PostVendorConsentAction.php`
- `apps/web/app/onboarding/[token]/steps/consent/ConsentStep.tsx`
- `apps/api/src/Entity/Wedding/WeddingConsent.php`
- `apps/web/app/couple-onboarding/CoupleOnboarding.tsx`

## RGPD-CONSENT-001 — Consentement explicite avant données sensibles

Statut : `active`

Les prestataires concernés doivent accepter ou refuser explicitement le
consentement `SensitiveData` avant que le parcours collecte les données
sensibles liées aux cultures et confessions.

Raison produit :

- les cultures et confessions peuvent être utilisées pour affiner le matching
avec les couples
- ces informations ne doivent pas être collectées implicitement
- le refus doit rester possible sans bloquer l'onboarding

Implémentation actuelle :

- `ConsentType::SensitiveData`
- `OnboardingStep::Consent`
- `ConsentStepHandler::handle()`
- `ConsentStep.tsx`

Contrat attendu :

- le prestataire voit une step dédiée au consentement avant `Experiences`
- le choix est enregistré avec un booléen `granted`
- accepter permet d'accéder à `Experiences`
- refuser permet de continuer sans collecter cultures/confessions

Couverture existante :

- `OnboardingStepResolverTest` vérifie que `Consent` est dans le parcours
nominal des types `Freelance`, `Traiteur` et `Createurs`

Couverture manquante :

- test unitaire `ConsentStepHandler` acceptation/refus
- test frontend ou E2E du choix accepter/refuser

## RGPD-CONSENT-002 — Refus et skip de la step expériences

Statut : `active`

Quand le consentement `SensitiveData` est refusé, la step `Experiences` doit
être sautée et considérée comme non bloquante pour la soumission finale.

Implémentation actuelle :

- `VendorOnboardingStepDispatcher::handle()` ajuste la prochaine step après un
refus
- `ExperiencesStepHandler::isFilled()` retourne `true` si le dernier
consentement existe et vaut `false`
- `VendorOnboardingOverviewBuilder::filterSensitiveSteps()` retire
`Experiences` de l'overview si le consentement n'est pas accordé

Contrat attendu :

- refus `Freelance` ou `Createurs` : prochaine step utile = `ZonesPricing`
- refus `Traiteur` : prochaine step utile = `CateringCharacteristics`
- `Credentials` ne doit pas être bloqué par l'absence d'expériences quand le
refus est enregistré

Couverture manquante :

- test dispatcher du skip selon vendor type
- test overview builder du filtrage
- test final submission avec consentement refusé

## RGPD-CONSENT-003 — Payload strictement booléen

Statut : `active`

Le champ `granted` est obligatoire et doit être un booléen natif.

Implémentation actuelle :

- `ConsentStepRequestDto::fromArray()`

Contrat attendu :

- absence de `granted` : exception domaine `422`
- valeur non booléenne : exception domaine `422`
- `true` et `false` sont tous les deux valides

Risque de régression :

- accepter des chaînes comme `"true"` ou `"false"` rendrait le consentement
ambigu et plus difficile à auditer.

## RGPD-CONSENT-004 — Consentement profil propriétaire uniquement

Statut : `active`

Un vendor connecté peut enregistrer une décision de consentement uniquement pour
son propre profil.

Implémentation actuelle :

- `PostVendorConsentAction`
- route `POST /api/v1/vendors/{id}/consent`
- `#[IsGranted('ROLE_VENDOR')]`
- comparaison `vendor->getUser() !== current user`
- `ConsentStepHandler::record()`

Contrat attendu :

- vendor introuvable : `404`
- vendor d'un autre user : `403`
- payload invalide : code d'erreur domaine, par défaut `422`
- succès : nouvelle entrée `VendorConsent`, réponse `201` avec `granted`

Couverture manquante :

- test controller accès propriétaire
- test controller accès interdit
- test création d'une nouvelle entrée de consentement

## RGPD-CONSENT-005 — Historique vs dernier état

Statut : `at-risk`

Le code utilise le dernier consentement par `createdAt DESC` comme source de
vérité métier, mais les deux points d'entrée ne gèrent pas l'historique de la
même manière.

Comportement actuel :

- `ConsentStepHandler::record()` crée toujours une nouvelle entrée
`VendorConsent`
- `PostVendorConsentAction` utilise `record()` et conserve donc une trace datée
à chaque appel
- `ConsentStepHandler::handle()` cherche la dernière entrée existante et modifie
son champ `granted`; s'il n'en existe pas, il en crée une
- `getStepData()` et `isFilled()` lisent le dernier consentement via
`createdAt DESC`

Pourquoi c'est fragile :

- si le besoin RGPD est un vrai historique immuable, modifier la dernière ligne
dans l'onboarding détruit une trace de changement
- si le besoin produit est seulement de stocker le dernier état, créer une ligne
à chaque appel profil peut produire un historique non intentionnel
- les audits et futurs écrans doivent savoir s'ils lisent un journal ou un état
courant

Décision attendue :

- soit chaque changement de consentement crée une nouvelle ligne immuable
- soit une seule ligne par vendor et type est mise à jour, avec éventuellement
un audit log séparé

Recommandation :

- pour un besoin RGPD, préférer une logique append-only et ne pas exposer de
setter qui modifie `granted` sur une décision déjà créée
- extraire la règle dans un service testable, par exemple
`VendorConsentService`, afin d'éviter une logique répartie entre handler et
controller

Couverture manquante :

- test qui fige la sémantique choisie : append-only ou dernier état mutable
- test de lecture du dernier consentement quand plusieurs entrées existent

E2E attendu :

- parcours onboarding : accepter puis revenir/refuser, vérifier le comportement
attendu selon la décision produit
- parcours profil : modifier le consentement après onboarding et vérifier que
l'overview/onboarding lit bien le dernier état attendu

## RGPD-CONSENT-006 — Consentement couple avant cultures et confessions

Statut : `active`

Le parcours couple demande un accord explicite avant les écrans de sélection
des confessions et cultures. Le refus efface les sélections locales, ne bloque
pas le parcours et désactive ce critère de matching.

Implémentation actuelle :

- écrans 3 à 5 dans `CoupleOnboarding.tsx`, conservés uniquement dans
  `sessionStorage` jusqu'à la création finale du compte
- `WeddingConsent` prévoit une trace append-only, liée au `Wedding`, qui sera
  créée par la soumission atomique de l'écran final

Contrat attendu :

- accepter précède toujours la sélection des confessions puis des cultures
- « Je préfère passer cette étape » transmet un refus avec des listes vides
- une modification ultérieure vers le refus doit supprimer les associations
  `Wedding.cultures` et `Wedding.confessions` dans la même transaction

Couverture existante :

- `navigation.test.ts` couvre la transition consentement accepté/refusé
- `couple-onboarding-store.test.ts` couvre `applySensitiveDataConsent` :
  effacement des confessions et cultures au refus, y compris après une saisie
- `WeddingConsentTest` couvre le modèle append-only et l'absence de setter

Couverture manquante :

- test de la soumission finale atomique, incluant la persistance de
  `WeddingConsent` et l'effacement des associations lors d'un refus ultérieur
- E2E desktop et mobile du parcours couple complet
