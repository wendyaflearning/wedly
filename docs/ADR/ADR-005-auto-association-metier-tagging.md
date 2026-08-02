# ADR-005 — Auto-association du métier lors du tagging de spécialités portfolio

## Statut

Accepté — août 2026

## Contexte

Bug découvert post-merge PR #74 (US4, epic [WED-59](mention://issue/477ecacd-50de-4d46-abfc-fcce16e280b0)) : PortfolioService::resolveSpecialtyTags()
exige que le service de la spécialité taguée soit déjà présent dans vendor.services. Un brouillon
de prestataire sans métier renseigné (cas courant : onboarding flash au salon, photo prise avant
tout formulaire) ne peut donc jamais confirmer un tag — l'erreur "La spécialité \[...\] est invalide
ou ne correspond à aucun service de ce prestataire." apparaît systématiquement, quel que soit le
choix. Le frontend autorise une action que le backend refuse toujours.

Deux options évaluées :

1. Bloquer le tagging tant qu'aucun métier n'est choisi en Profession (gate UI)
2. Auto-associer le service de la spécialité au vendor au moment de la confirmation du tag

## Décisions

### 1. Auto-association plutôt que gate UI

Choix retenu : confirmer un tag ajoute automatiquement le service correspondant à vendor.services
(relation many-to-many, opération d'ajout — jamais de remplacement). Le tagging devient une façon
valide de renseigner le métier, pas un acte séparé qui en dépend.

Alternative écartée : gate UI. Réintroduit une étape bloquante dans le flow d'onboarding flash
salon, use case prioritaire de l'epic [WED-59](mention://issue/477ecacd-50de-4d46-abfc-fcce16e280b0). Coût d'implémentation plus élevé (nouvel état UI
accordéon désactivé + re-synchronisation du formulaire) pour un gain nul, et ne gère pas
nativement le multi-métier (VENDOR }o--o{ SERVICE est many-to-many).

### 2. Badge visuel pour l'origine du service

Choix retenu : un badge "ajouté automatiquement" s'affiche en Profession pour tout service dont
l'origine est le tagging (par opposition à une saisie manuelle).

## Conséquences

Positives : zéro friction au salon, implémentation minimale (services.add() au moment du confirm),
compatible nativement avec le multi-métier sans logique conditionnelle.
Risques acceptés : un admin peut ne pas remarquer qu'un métier a été ajouté "malgré lui" via
tagging — mitigé par le badge visuel en Profession.

## Révision prévue

À réévaluer si le multi-métier ajouté via tagging crée de la confusion en usage réel (retour
terrain Jennifer) — auquel cas ajouter une confirmation explicite au premier tag d'un nouveau
métier.

## Référence

Ticket source : WED-95
PR concernée : #74 (mergée, ce fix est un fast-follow)
ADR miroir Notion : [https://app.notion.com/p/3b0bd0a11690818c8bc4d9bfc0f5668c](https://app.notion.com/p/3b0bd0a11690818c8bc4d9bfc0f5668c)
