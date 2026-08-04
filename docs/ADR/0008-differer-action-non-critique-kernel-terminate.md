# ADR-0008 — Différer une action non-critique après la réponse HTTP (kernel.terminate)

## Contexte
Certaines actions déclenchées par un event métier (ex: notification Slack
lors d'une inscription prestataire) ne doivent pas ralentir ni faire
échouer la réponse HTTP renvoyée à l'utilisateur si elles échouent. Une
première occurrence de ce besoin a été traitée pour WED-2 (notification
Slack de nouvelle inscription).

## Décision
Un listener écoute deux événements :
1. L'event métier (ex: VendorOnboardingSubmittedEvent), déclenché pendant
   la requête — le listener y mémorise uniquement les données nécessaires
   dans une propriété d'instance, sans effectuer l'action elle-même
2. kernel.terminate, déclenché après l'envoi de la réponse HTTP — le
   listener y exécute l'action réelle si des données ont été mémorisées

Ce pattern s'appuie sur le fait qu'une instance de service Symfony persiste
sur toute la durée d'une requête PHP-FPM classique. La classe qui
implémente ce pattern ne peut pas être `readonly` (la propriété de
mémorisation doit être réécrite entre les deux événements).

## Conséquences
- Réutilisable pour toute future notification différée (Wedplan, Wedwallet)
- Contrat de robustesse associé : try/catch interne à l'action réelle,
  logger->error() en cas d'échec, jamais de rethrow — l'échec de l'action
  différée ne doit jamais impacter la requête d'origine, qui est déjà
  terminée de toute façon
- ⚠️ Ce pattern suppose un cycle de vie "une requête = une instance". Il
  deviendrait risqué (fuite d'état entre requêtes) sous un runtime worker
  persistant (FrankenPHP worker mode, RoadRunner). Non applicable à
  l'infra actuelle (PHP-FPM classique), à revisiter si l'infra change.
