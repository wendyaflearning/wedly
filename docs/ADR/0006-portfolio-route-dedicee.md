# ADR-XXX — Route dédiée pour l'étape portfolio de l'onboarding prestataire

## Statut
Accepté — 05 mai 2026

## Contexte
Le stepper d'onboarding prestataire utilise une route générique :
`PATCH /api/v1/vendors/onboarding/{token}`
Cette route parse le corps de la requête via `json_decode($request->getContent())`.

L'étape portfolio nécessite le transport de fichiers binaires (photos). Le protocole HTTP impose `multipart/form-data` pour ce cas, qui est incompatible avec le parsing JSON du dispatcher générique : `$request->getContent()` retourne un corps vide en multipart.

## Décision
Créer une route dédiée :
`PATCH /api/v1/vendors/onboarding/{token}/portfolio`

Cette route utilise `$request->files` et `$request->request` au lieu de `$request->getContent()`.
Le dispatcher générique (`VendorOnboardingStepService`) n'est pas modifié.
L'étape `OnboardingStep::Portfolio` reste dans l'enum mais n'est plus routée via le dispatcher JSON.

## Conséquences
- Le stepper a une exception de routing documentée et assumée
- Un développeur qui intègre l'API doit traiter cette route différemment des autres étapes
- Le dispatcher générique reste propre — pas de `if ($step === 'portfolio')` dans le controller
- La dette est localisée et traçable

## Alternatives écartées
- **Piste A — Exception sur la route générique** : nécessitait un `if` dans le controller pour bifurquer selon le `Content-Type`, cassant le principe de la route générique
- **Base64 dans du JSON** : charge × 1,37 par fichier, inacceptable sur VPS Hostinger avec 5 photos

## Référence
- Plan d'implémentation US-S3005
- Journal de bord 03 mai 2026
