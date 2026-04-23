# ADR-0004 — Token URL comme mécanisme d'authentification pour l'onboarding

**Date :** 21 avril 2026  
**Statut :** Accepté

## Contexte

L'onboarding prestataire nécessite un accès sécurisé sans que le vendor ait encore de compte actif. Deux approches possibles : JWT classique ou token URL à usage limité.

## Décision

Utilisation d'un token opaque (UUID) transmis dans l'URL, résolu via `InviteTokenService`. Pas de JWT sur les routes d'onboarding.

## Justification

- Le vendor n'a pas encore de credentials à ce stade — un JWT supposerait une authentification préalable
- Pattern éprouvé : même principe qu'un lien de reset de mot de passe
- Firewall dédié sans JWT dans `security.yaml` — pas de complexité d'authentification superflue
- Le token est à usage limité (`pending → used`) et lié à un persona identifié

## Conséquences

- Le token reste `pending` pendant toute la durée du stepper — il passe `used` uniquement à la complétion de l'étape `credentials`
- `expires_at` non vérifié en MVP — dette consciente documentée, à implémenter en V2
- Route agnostique `/api/v1/invite-tokens/{token}` compatible onboarding couple futur
