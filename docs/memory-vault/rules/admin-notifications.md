# Admin Notifications

## Scope

Règles liées aux notifications in-app visibles dans le backoffice admin.

Code principal :

- `apps/api/src/Service/Admin/AdminNotificationService.php`
- `apps/api/src/Event/VendorSubmittedForReviewEvent.php`
- `apps/api/src/EventListener/CreateVendorSubmittedAdminNotificationsListener.php`
- `apps/api/src/Controller/Admin/Notification/*`
- `apps/web/components/admin/AdminNotificationsBell.tsx`

Tests existants :

- `apps/api/tests/Unit/Admin/AdminNotificationServiceTest.php`
- `apps/api/tests/Unit/Controller/Admin/Notification/AdminNotificationActionsSecurityTest.php`

## ADMIN-NOTIFICATION-001 — Soumission prestataire notifie les admins dans l'app

Statut : `active`

Quand un prestataire termine son onboarding et passe en `under_review`, une
notification persistante doit être créée pour chaque admin existant.

Contrat attendu :

- type `provider_pending_review`
- payload structuré avec `provider_id`, `provider_name`, `provider_category`,
  `submitted_at`
- aucun lien HTTP absolu dans le payload

## ADMIN-NOTIFICATION-002 — Anti-doublon par admin tant que la notification est non lue

Statut : `active`

Un même admin ne doit pas recevoir plusieurs notifications actives pour le même
prestataire et le même type tant que la notification précédente reste non lue.

Implémentation actuelle :

- `AdminNotificationRepository::hasUnreadForRecipientAndProvider()`
- `AdminNotificationService::createProviderPendingReviewNotifications()`

Note produit :

- un nouveau passage en `under_review` peut recréer une notification si la
  précédente a déjà été lue ; le comportement après rejet/résoumission devra
  être revalidé si la règle métier évolue

## ADMIN-NOTIFICATION-003 — Lecture et accès réservés aux admins destinataires

Statut : `active`

Seuls les admins authentifiés peuvent lister, compter et marquer lues les
notifications ; un admin ne peut marquer comme lue qu'une notification qui lui
appartient.

## ADMIN-NOTIFICATION-004 — Le backoffice admin rafraîchit par polling

Statut : `active`

Le frontend admin doit :

- afficher un badge de non lues dans le layout
- rafraîchir les notifications toutes les 30 secondes
- déclencher un refresh immédiat à l'ouverture du panneau
- suspendre le polling quand l'onglet est inactif
