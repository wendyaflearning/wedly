Implémentation de WED-3 terminée dans le repo `wedly`.

- Backend: ajout d’une notification admin persistée créée à la soumission onboarding vers `under_review`, avec déduplication tant qu’une notification équivalente reste non lue, endpoints admin protégés pour liste / compteur / marquage lu, et mise à jour du schéma + memory vault.
- Frontend: ajout d’une cloche dans le layout admin avec badge non lues, panneau de notifications, refresh immédiat à l’ouverture, polling toutes les 30s avec pause onglet inactif, et navigation vers `/admin/prestataires/{provider_id}` au clic.
- Couverture: tests unitaires backend ciblés sur création/déduplication/permissions, et mise à jour du test dispatcher onboarding.

PR: https://github.com/wendyaflearning/wedly/pull/17

Vérifications exécutées :
- `php bin/phpunit tests/Unit/Admin/AdminNotificationServiceTest.php tests/Unit/Controller/Admin/Notification/AdminNotificationActionsSecurityTest.php tests/Unit/Dispatcher/Vendor/Onboarding/VendorOnboardingStepDispatcherTest.php`
- `php bin/console doctrine:schema:validate`
- `php bin/console doctrine:migrations:migrate --dry-run`
- `./node_modules/.bin/tsc --noEmit`
- `npm run lint` (OK avec warnings préexistants hors périmètre)

Impact E2E à valider côté QA/UX :
- parcours admin: un prestataire termine son onboarding, la cloche admin affiche une notification non lue, l’ouverture du panneau recharge bien la liste, le clic ouvre la fiche prestataire et marque l’item comme lu
- cas bord: pas de doublon non lu pour le même prestataire/admin tant que la notification précédente n’est pas lue, et le polling reste silencieux quand l’onglet n’est pas actif

Point à confirmer avec le lead dev : si un prestataire déjà rejeté repasse plus tard par `under_review` après qu’une ancienne notification a été lue, l’implémentation recrée aujourd’hui une nouvelle notification. Si vous voulez un autre comportement sur ce cycle de resoumission, il faudra le préciser.
