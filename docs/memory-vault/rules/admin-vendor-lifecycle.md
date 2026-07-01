# Admin Vendor Lifecycle

## Scope

Règles liées à la création de brouillons prestataires, à l'envoi d'invitations
et à la revue admin des profils.

Code principal :

- `apps/api/src/Service/Vendor/AdminVendorDraftService.php`
- `apps/api/src/Service/Vendor/AdminVendorInvitationService.php`
- `apps/api/src/Service/Vendor/AdminVendorReviewService.php`
- `apps/api/src/Event/VendorValidatedEvent.php`
- `apps/api/src/Event/VendorRejectedEvent.php`

Tests existants :

- `apps/api/tests/Unit/Vendor/AdminVendorDraftServiceTest.php`
- `apps/api/tests/Unit/Vendor/AdminVendorInvitationServiceTest.php`
- `apps/api/tests/Unit/Vendor/AdminVendorReviewServiceTest.php`

## ADMIN-VENDOR-001 — Brouillon verrouillé après invitation utilisée

Statut : `active`

Un brouillon prestataire ne peut plus être édité si une invitation associée a
déjà été utilisée.

Raison produit :

- éviter que l'admin modifie les données de base après que le prestataire a
pris possession de son onboarding
- préserver la responsabilité des changements post-invitation

Implémentation actuelle :

- `AdminVendorDraftService::assertEditable()`
- `InviteTokenRepository::hasUsedVendorInvitation()`

Contrat attendu :

- tentative d'édition : exception domaine `409`
- tentative de renvoi d'invitation : exception domaine `409`

Couverture attendue :

- test unitaire update bloqué quand invitation utilisée
- test unitaire sendInvitation bloqué quand invitation utilisée

## ADMIN-VENDOR-002 — Données minimales avant invitation

Statut : `active`

L'invitation d'un prestataire exige les données coeur suivantes :

- prénom utilisateur
- email utilisateur
- nom de marque
- au moins un service
- au moins une région
- prix minimum et maximum cohérents

Implémentation actuelle :

- `AdminVendorDraftService::assertVendorReadyForInvitation()`
- `AdminVendorDraftService::assertRequiredFields()` pour la création initiale

Contrat attendu :

- données manquantes : exception domaine `422`
- prix négatif ou `priceMin > priceMax` : exception domaine `422`

Risque de régression :

- une validation plus faible peut envoyer des invitations inutilisables
- une validation différente entre création, update et invitation peut créer des
états incohérents

## ADMIN-VENDOR-003 — Validation admin d'un prestataire

Statut : `active`

Valider un prestataire doit :

- passer le vendor en `Active`
- publier le profil
- renseigner `reviewedAt`
- supprimer les raisons et notes de rejet précédentes
- passer le user associé en `Active`
- envoyer l'événement de validation uniquement si le vendor n'était pas déjà actif

Implémentation actuelle :

- `AdminVendorReviewService::validate()`

Couverture attendue :

- test unitaire sur les changements de statut
- test unitaire garantissant l'idempotence de l'événement
- test unitaire sur la suppression des traces de rejet

## ADMIN-VENDOR-004 — Rejet admin d'un prestataire

Statut : `active`

Rejeter un prestataire doit :

- passer le vendor en `Rejected`
- dépublier le profil
- renseigner `reviewedAt`
- stocker au moins une raison de rejet
- suspendre le user associé
- envoyer l'événement de rejet uniquement si le vendor n'était pas déjà rejeté

Une note de rejet ne peut être fournie que si la raison `Other` est présente.

Implémentation actuelle :

- `AdminVendorReviewService::reject()`
- `AdminVendorReviewService::resolveRejectionReasons()`
- `AdminVendorReviewService::normalizeRejectionNote()`

Couverture attendue :

- test unitaire sans raison : exception `422`
- test unitaire raison inconnue : exception `422`
- test unitaire note sans `Other` : exception `422`
- test unitaire idempotence de l'événement

E2E attendu :

- parcours admin : créer un brouillon, envoyer une invitation, puis vérifier que
l'état d'invitation et le verrouillage d'édition restent cohérents après usage
du lien
- parcours admin review : valider puis rejeter un profil et vérifier les statuts
visibles côté admin
