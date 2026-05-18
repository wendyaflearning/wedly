# ADR-004 — Strategy Pattern pour la gestion des steps d'onboarding prestataire

**Date :** 14 mai 2026  
**Statut :** Accepté  
**Décideurs :** Wendy (CTO)

---

## Contexte

Le stepper d'onboarding prestataire est composé de plusieurs steps successives 
(professions, experiences, zone/tarifs, portfolio, légal, credentials). 
Chaque step possède sa propre logique de validation, de persistance, 
et de sérialisation pour `steps_data`.

### L'ancienne architecture — Le dispatcher `match`

`VendorOnboardingStepDispatcher` centralisait toute la logique via un `match` 
sur le step reçu en payload. Chaque nouvelle step = une nouvelle dépendance 
injectée dans le constructeur.

### Problèmes identifiés

1. **Explosion des dépendances** — ~10 dépendances dans le constructeur à 2 steps
2. **Duplication de `steps_data`** — décrite deux fois : GET overview + PATCH onboarding
3. **Violation du principe Open/Closed** — ajouter une step = modifier une classe existante

---

## Décision

Adoption du **Strategy Pattern** via l'injection de dépendances Symfony avec auto-tagging.

### Architecture

### Mécanisme #[AutoconfigureTag]

`StepHandlerInterface` porte l'attribut. Symfony scanne `src/`, remonte 
l'arbre d'héritage de chaque classe, et attribue automatiquement le tag 
`onboarding.step_handler` à tout service qui implémente l'interface — 
directement ou via héritage. Aucune déclaration dans `services.yaml` requise.

Prérequis : `autoconfigure: true` dans `services.yaml` (actif par défaut).

### Dispatcher après refacto

```php
public function __construct(
    private EntityManagerInterface $em,
    private OnboardingStepResolver $resolver,
    #[TaggedIterator('onboarding.step_handler')]
    private iterable $handlers,
) {}
```

3 dépendances fixes quelle que soit le nombre de steps (`$handlers` agrège tous les handlers via le tag).

### Centralisation de steps_data

Chaque handler expose `getStepData(Vendor $vendor): array`. 
Le dispatcher agrège — une seule source de vérité pour le GET et le PATCH.

---

## Conséquences

✅ Zéro modification du dispatcher pour ajouter une step  
✅ Une dépendance unique dans le dispatcher  
✅ Fin de la duplication de `steps_data`  
✅ Chaque handler testable indépendamment  

⚠️ `autoconfigure: true` doit rester actif dans `services.yaml`  
⚠️ `supports()` doit être strictement exclusif entre handlers  

---

## Pour ajouter une nouvelle step

1. Créer une classe qui étend `AbstractOnboardingStepHandler`
2. Implémenter `supports(): OnboardingStep`
3. Implémenter `handle(Vendor $vendor, array $data): void`
4. Implémenter `getStepData(Vendor $vendor): array`
5. C'est tout — Symfony l'enregistre automatiquement.

---

## Alternatives écartées

**Garder le `match`** — ne résout ni l'explosion des dépendances ni 
la duplication. Dette reportée, pas remboursée.

**Tagged services via `services.yaml` uniquement** — équivalent fonctionnel, 
mais colocaliser la config dans l'interface PHP est plus maintenable.
