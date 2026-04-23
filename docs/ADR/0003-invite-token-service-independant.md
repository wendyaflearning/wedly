# ADR-0003 — InviteTokenService indépendant de VendorService

**Date :** 21 avril 2026  
**Statut :** Accepté

## Contexte

La résolution d'un token d'invitation pourrait être placée dans `VendorService` puisque le premier usage concerne les vendors. Deux approches possibles : intégrer la logique dans `VendorService` ou créer un service dédié.

## Décision

Création d'un `InviteTokenService` indépendant, responsable uniquement de la résolution et validation des tokens d'invitation.

## Justification

- Un `InviteToken` peut être associé à un `Vendor` ou à un `Couple` — la logique est transverse
- Placer la résolution dans `VendorService` créerait un couplage incorrect dès l'onboarding couple
- Single Responsibility — `VendorService` gère les vendors, pas les tokens

## Conséquences

- `InviteTokenService` est le point d'entrée unique pour toute résolution de token, quel que soit le persona
- Extensible sans modifier les services métier existants
