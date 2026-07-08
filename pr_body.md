## Summary

- add persistent admin notifications when a vendor completes onboarding and moves to `under_review`
- expose admin notification list, unread count, and mark-as-read endpoints with recipient ownership checks
- add the admin bell UI with polling every 30 seconds, refresh on panel open, and client-side navigation to `/admin/prestataires/{provider_id}`
- update the schema source of truth and memory-vault rules for admin notifications

## Why

This change adds the in-app admin notification channel requested in WED-3 so admins do not depend only on Slack or manual backoffice checks for new vendor submissions.

Closes WED-3

## Tests

- `php bin/phpunit tests/Unit/Admin/AdminNotificationServiceTest.php tests/Unit/Controller/Admin/Notification/AdminNotificationActionsSecurityTest.php tests/Unit/Dispatcher/Vendor/Onboarding/VendorOnboardingStepDispatcherTest.php`
- `php bin/console doctrine:schema:validate`
- `php bin/console doctrine:migrations:migrate --dry-run`
- `./node_modules/.bin/tsc --noEmit`
- `npm run lint` (passes with pre-existing warnings outside this scope)

## E2E Impact

- affected journey: admin backoffice receives a notification after a vendor submits onboarding, opens the notification panel, clicks the notification, and lands on the vendor review page
- happy path: vendor completes onboarding, admin sees unread badge, opens the bell, clicks the new notification, and the item becomes read while navigating to the vendor profile
- edge cases: duplicate submission should not create a second unread notification for the same admin/vendor pair; a different admin must not be able to mark someone else's notification as read; polling should not refresh while the tab is hidden

## Reactive State Risk

- low to moderate: the new client state is isolated inside the bell component and limited to polling/open/read transitions, but the polling timer and visibility-state behavior are the main regression surfaces to watch in QA
