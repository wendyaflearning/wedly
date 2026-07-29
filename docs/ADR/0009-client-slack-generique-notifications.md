# ADR-0009 — Client Slack générique pour les notifications sortantes

## Contexte

Deux notifications Slack existent ou sont en cours : feedback prestataire
(VendorFeedbackService::notifySlack()) et confirmation d'inscription
(WED-2). Les deux appellent HttpClientInterface en dur, vers le même
webhook (SLACK_WEBHOOK, channel activités-prestataires). D'autres
notifications sont prévues (Wedplan, Wedwallet).

## Décision

Extraction d'un SlackWebhookClient (App\Integration\Slack) :

- Une seule méthode notify(string $message): void
- Le client lève l'exception en cas d'échec (URL injoignable, timeout,
  statut >= 400) — il ne catch jamais lui-même
- Chaque appelant est responsable de son try/catch + logger->error(),
  sans rethrow (pattern déjà en place pour l'email de confirmation)
- URL du webhook résolue via #[Autowire('%env(SLACK_WEBHOOK)%')] sur le
  paramètre constructeur — pattern déjà utilisé dans le repo pour
  $frontendUrl (VendorOnboardingConfirmationEmailListener). Pas de binding
  global ni de duplication dans services.yaml.

## Conséquences

- VendorFeedbackService::notifySlack() migré sur ce client (prochaine
  tâche séparée, pas dans ce prompt)
- Un seul point de vérité pour timeout/config Slack
- Pas d'abstraction multi-canal (email, futurs SMS) à ce stade — hors
  scope, à revisiter si un 3e canal de notif apparaît
