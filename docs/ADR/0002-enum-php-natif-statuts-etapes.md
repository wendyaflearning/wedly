# ADR-0002 — Enum PHP natif pour les statuts et étapes

**Date :** 21 avril 2026  
**Statut :** Accepté

## Contexte

Plusieurs entités nécessitent des valeurs contrôlées : statut du vendor (`VendorStatus`), statut du couple (`CoupleStatus`), étapes d'onboarding (`OnboardingStep`). Deux approches possibles : constantes de classe ou enum PHP natif.

## Décision

Utilisation des `backed enum string` natifs PHP 8.3 pour tous les types à valeurs contrôlées.

## Justification

- Typage fort — une méthode qui attend un `VendorStatus` ne peut pas recevoir une string arbitraire
- `tryFrom()` intégré — gestion propre des valeurs inconnues sans code défensif supplémentaire
- Valeurs stables — les cas ne changent pas souvent, pas besoin de flexibilité dynamique
- Support Doctrine natif via `enumType` — pas de conversion manuelle

## Conséquences

- Toute nouvelle valeur nécessite une modification de l'enum et une migration si mappé en base
- Les valeurs en base sont des strings lisibles (`pending`, `active`, etc.)
