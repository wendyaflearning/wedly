# Invite Tokens

## Scope

Règles liées à la résolution, l'expiration et la consommation des tokens
d'invitation.

Code principal :

- `apps/api/src/Service/InviteTokenService.php`
- `apps/api/src/Entity/User/InviteToken.php`
- `apps/api/src/Enum/User/InviteTokenStatus.php`
- `apps/api/src/Repository/User/InviteTokenRepository.php`

Tests existants à maintenir ou compléter :

- `apps/api/tests/Unit/Vendor/AdminVendorInvitationServiceTest.php`
- tests unitaires dédiés à `InviteTokenService` à ajouter si absents

## INVITE-TOKEN-001 — Résolution d'un token valide

Statut : `active`

Un token ne peut être résolu que s'il existe, que son statut est `Pending` et
que sa date d'expiration est dans le futur.

Raison produit :

- empêcher la réutilisation d'un lien déjà consommé
- empêcher l'accès onboarding via un lien expiré
- renvoyer une erreur claire au frontend

Implémentation actuelle :

- `InviteTokenService::resolve()`

Contrat attendu :

- token introuvable : exception domaine `404`
- token non `Pending` : exception domaine `410`
- token expiré : exception domaine `410`
- token valide : retourne l'entité `InviteToken`

Couverture attendue :

- test unitaire token introuvable
- test unitaire token déjà utilisé
- test unitaire token expiré
- test unitaire token valide

Risque de régression :

- changer les codes d'erreur peut casser le parcours onboarding côté frontend
- oublier le statut `Pending` permettrait de réutiliser un lien consommé

## INVITE-TOKEN-002 — Expiration persistée

Statut : `active`

Quand un token expiré est résolu, son statut doit passer à `Expired` et être
persisté.

Implémentation actuelle :

- `InviteTokenService::resolve()`

Couverture attendue :

- vérifier que `flush()` est appelé après passage à `Expired`
- vérifier que le statut est bien modifié avant l'exception

Point d'audit :

- confirmer que les listes admin d'invitations actives/expirées restent
alignées avec cette règle.

## INVITE-TOKEN-003 — Consommation d'un token

Statut : `active`

Consommer un token le fait passer à `Used`.

Implémentation actuelle :

- `InviteTokenService::consume()`

Couverture attendue :

- test unitaire : statut `Used` + persistence

Question produit à clarifier :

- le service ne vérifie pas lui-même que le token est `Pending` au moment de
`consume()`. C'est acceptable si tous les appels passent par `resolve()` avant,
mais ce contrat doit être vérifié lors des audits de parcours.
