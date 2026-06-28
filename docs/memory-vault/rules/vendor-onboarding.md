# Vendor Onboarding

## Scope

Règles liées au stepper d'onboarding prestataire.

Code principal :

- `apps/api/src/Dispatcher/Vendor/Onboarding/VendorOnboardingStepDispatcher.php`
- `apps/api/src/Resolver/Vendor/OnboardingStepResolver.php`
- `apps/api/src/Handler/Vendor/Onboarding/*StepHandler.php`
- `apps/api/src/Enum/Vendor/OnboardingStep.php`
- `apps/api/src/Enum/Vendor/VendorType.php`

ADR liée :

- `docs/ADR/ADR-004-strategy-pattern-onboarding-step-handler.md`

## VENDOR-ONBOARDING-001 — Steps dépendantes du type de prestataire

Statut : `active`

Les steps disponibles et leur ordre dépendent du type de prestataire résolu
pour le vendor.

Implémentation actuelle :

- `OnboardingStepResolver::getOnboardingSteps()`
- `Vendor::resolveVendorType()`

Contrat attendu :

- un handler doit déclarer un `supports()` strictement exclusif par step
- un handler peut restreindre son application via `supportsVendorType()`
- l'ordre retourné par le resolver pilote la progression et la completion

Risque de régression :

- ajouter un nouveau type de prestataire sans mettre à jour le resolver peut
bloquer le parcours
- deux handlers éligibles pour la même step et le même type rendent le
comportement dépendant de l'ordre d'injection

## VENDOR-ONBOARDING-002 — Soumission finale bloquée si étapes incomplètes

Statut : `active`

La step `Credentials` ne peut être traitée que si toutes les étapes
obligatoires précédentes sont remplies.

Implémentation actuelle :

- `VendorOnboardingStepDispatcher::assertAllStepsFilled()`
- `StepHandlerInterface::isFilled()`

Contrat attendu :

- si une étape obligatoire est incomplète, exception domaine `422`
- le message liste les étapes incomplètes
- si tout est complet, la step finale déclenche `StepperSubmittedEvent`

Couverture attendue :

- test unitaire ou fonctionnel de blocage si step obligatoire manquante
- test unitaire ou fonctionnel du déclenchement final quand tout est complet

E2E attendu :

- parcours prestataire complet : remplir les étapes dans l'ordre, soumettre les
credentials, vérifier que la confirmation est déclenchée
- edge case réaliste : tentative de soumission finale avec une étape obligatoire
manquante

## VENDOR-ONBOARDING-003 — `steps_data` centralisé dans les handlers

Statut : `active`

Les données renvoyées au frontend pour les steps complétées doivent être
produites par les handlers, pas dupliquées dans le dispatcher ou les controllers.

Raison technique :

- garder une source unique entre écriture PATCH et lecture GET
- éviter qu'une évolution de step casse la reprise du formulaire

Implémentation actuelle :

- `StepHandlerInterface::getStepData()`
- `VendorOnboardingStepDispatcher::buildStepsData()`

Risque de régression :

- ajouter une nouvelle step sans `getStepData()` cohérent peut casser la reprise
du formulaire
- dupliquer la sérialisation dans un controller crée une divergence silencieuse

## VENDOR-ONBOARDING-004 — SIRET et Pappers

Statut : `active`

Pappers inaccessible ou sans résultat ne signifie pas que l'entreprise est
inactive. Dans ce cas, `siret_verified` doit être `false`, mais le statut légal
ne doit pas être forcé à une valeur d'inactivité.

Implémentation actuelle :

- `LegalInfoStepHandler::handle()`
- `PappersService::findBySiret()`

Contrat attendu :

- Pappers retourne une entreprise active : données légales remplies,
`siret_verified = true`
- Pappers retourne une entreprise inactive : données légales remplies,
`siret_verified = false`, warning loggé
- Pappers indisponible ou sans résultat : `siret_verified = false`, warning
loggé, pas d'assimilation à une entreprise inactive

Couverture attendue :

- test handler avec réponse active
- test handler avec réponse inactive
- test handler avec réponse nulle

Fragilité à surveiller :

- `LegalInfoStepHandler` contient une vraie règle métier et une intégration
externe. Si la logique Pappers grossit, extraire une politique dédiée rendra les
tests plus directs.
