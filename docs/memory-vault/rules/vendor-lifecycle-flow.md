# Vendor Lifecycle Flow Reference

## Scope

Référence visuelle issue de WED-22 et WED-47 pour le cycle prestataire
complet :

- invitation admin
- onboarding prestataire
- validation admin
- refus et resoumission
- miroir admin ↔ prestataire

Cette note documente le **flux cible** validé côté produit. Quand le code ou
les règles existantes ne sont pas encore alignés, l'écart est listé dans la
section `Gaps`.

Sources consolidées :

- WED-22 description + fil de commentaires
- WED-47 description
- `docs/memory-vault/rules/invite-tokens.md`
- `docs/memory-vault/rules/admin-vendor-lifecycle.md`
- `docs/memory-vault/rules/vendor-onboarding.md`
- `apps/api/src/Enum/User/InviteTokenStatus.php`
- `apps/api/src/Enum/Vendor/VendorStatus.php`
- `apps/api/src/Enum/User/UserStatus.php`
- `apps/api/src/Enum/Vendor/OnboardingStep.php`

## Schemas to review

Fichiers Mermaid versionnés :

- `rules/vendor-lifecycle-current-develop.mmd`
- `rules/vendor-lifecycle-target.mmd`

## Schema 1 — Current flow on `develop`

```mermaid
flowchart TD
    A[Admin draft\nVendor pending\nUser pending\nAdmin view: Brouillons]
    B[Invitation active\nInviteToken pending\nexpires_at = now + 30 days\nAdmin view: Invitations en attente]
    C[Onboarding via invite link\nToken still pending\nResume allowed while token remains valid]
    D[Invitation expired\nVisible in Expirees list]
    E[Submitted for admin review\nVendor under_review\nUser under_review\nInviteToken used\nAdmin view: En attente]
    F[Vendor validated\nVendor active\nUser active\nVendor dashboard accessible]
    G[Vendor refused\nVendor rejected\nUser suspended\nVendor dashboard blocked]

    A -->|Admin sends invitation| B
    B -->|Vendor opens link| C
    B -->|expires_at passed| D
    C -->|Resume later| C
    C -->|Credentials step completed| E
    C -->|expires_at passed before completion| D
    D -->|Admin sends invitation again| B
    E -->|Admin validates| F
    E -->|Admin rejects| G
```

Points clefs du flux actuel :

- l'onglet admin s'appelle encore `Invitations en attente`
- un token `pending` expire dès que `expires_at` est dépassé, même si
  l'onboarding avait déjà été commencé
- le refus admin mène à `vendor.rejected` et il n'existe pas de boucle de
  correction / resoumission dédiée dans `develop`

## Schema 2 — Target flow from WED-22 + notes Granola

```mermaid
flowchart TD
    A[Admin draft\nVendor pending\nUser pending\nAdmin view: Brouillons]
    B[Invitation sent\nInviteToken pending\nAdmin view: Onboarding en cours]
    C[Onboarding in progress\nonboarding_step tracks resume point\nLink remains reusable while onboarding is incomplete]
    D[Invitation expired\nOnly if onboarding never started\nAdmin CTA: Regenerer le lien]
    E[Waiting for admin validation\nVendor under_review\nUser under_review\nInviteToken used\nOnboarding link invalid\nAdmin view: En attente de validation]
    F[Vendor validated\nVendor active\nUser active\nVendor dashboard accessible]
    G[Adjustment requested\nTarget state: Vendor suspended\nUser suspended\nVendor sees correction view only]
    H[Resubmitted for review\nVendor under_review\nAdmin banner: En reexamination\nModified sections highlighted]

    A -->|Admin sends invitation| B
    B -->|Vendor opens onboarding| C
    B -->|30 days with no onboarding access| D
    C -->|Resume later| C
    C -->|Credentials step completed| E
    D -->|Admin regenerates invitation| B
    E -->|Admin validates| F
    E -->|Admin refuses| G
    G -->|Vendor corrects and resubmits| H
    H -->|Admin validates| F
    H -->|Admin refuses again| G
```

Points clefs du flux cible :

- l'onglet admin `Invitations en attente` devient `Onboarding en cours`
- l'onglet admin `En attente` devient `En attente de validation`
- l'expiration à 30 jours ne s'applique que si le prestataire n'a jamais
  commencé l'onboarding
- le refus ouvre un vrai cycle de correction / resoumission au lieu de couper
  le flux sur `rejected`

## Mirror table

| Phase | Current `develop` | Target after WED-22 / Granola |
|---|---|---|
| Draft before invitation | `vendor.pending`, `user.pending`, admin view `Brouillons` | inchangé |
| Invitation sent, onboarding not started | token `pending`, admin view `Invitations en attente` | token `pending`, admin view `Onboarding en cours` |
| Onboarding in progress | resume allowed while token stays `pending` and unexpired | resume allowed while onboarding incomplete via `onboarding_step` |
| Expiry rule | any overdue `pending` token becomes unusable | only expires after 30 days if onboarding never started |
| Onboarding completed | token `used`, `vendor.under_review`, `user.under_review`, admin view `En attente` | same statuses, but admin view renamed `En attente de validation` |
| Validation | `vendor.active`, `user.active`, dashboard accessible | inchangé |
| Refusal | `vendor.rejected`, `user.suspended`, blocked dashboard, no correction loop | `vendor.suspended` target, `user.suspended`, dedicated correction view |
| Resubmission | no explicit flow in `develop` | `POST /api/v1/vendors/me/resubmit-review` returns vendor to `under_review` |

## Coverage vs implementation tickets

| Ticket lot | Scope covered by the flow |
|---|---|
| Ticket 1 | Semantics of token expiry, token `used`, `onboarding_step` resume rules, status model clarification required for refusal/resubmission |
| Ticket 2 | Admin wording and mutual exclusivity between `Onboarding en cours` and `En attente de validation` |
| Ticket 3 | Regeneration path for an expired invitation |
| Ticket 4 | Prestataire blocked screen while `under_review` |
| Ticket 5 | Refusal email, correction view, resubmission endpoint, admin banners and section markers |

## Gaps

### Coverage conclusion

Le decoupage 1 a 5 couvre bien le scope produit **a condition** de clarifier le
modele d'etat exact du cycle refus/resoumission dans Ticket 1 ou 5a. Sans cette
clarification, la partie refus reste ambiguë.

### Documented discrepancies with the current codebase

1. `InviteTokenStatus` ne contient aujourd'hui que `pending`, `used` et
   `expired`. Il n'existe pas de statut `under_review` pour les tokens. Le flux
   cible doit donc traiter `under_review` comme un etat vendor/user, pas comme
   un enum de token, sauf evolution explicite ulterieure.
2. `VendorStatus` ne contient aujourd'hui pas `suspended`. Le code et la regle
   `ADMIN-VENDOR-004` utilisent encore `rejected` lors d'un refus admin.
3. `UserStatus` contient `suspended`, mais l'etat apres resoumission n'est pas
   encore tranche entre retour a `under_review` et maintien en `suspended`
   jusqu'a la revalidation admin.
4. `InviteTokenService::resolve()` expire tout token `pending` depasse, sans
   verifier si l'onboarding a deja commence. Cela contredit la decision produit
   `expiration uniquement si le prestataire n'a jamais accede a l'onboarding`.
5. Le frontend prestataire actuel affiche seulement un ecran bloque generique
   pour les statuts non `active`. La vue correction dediee et l'ecran
   `En reexamination` ne sont pas encore implementes.
6. Le wording admin actuel reste `Invitations en attente` et `En attente`.
   Le renommage cible `Onboarding en cours` / `En attente de validation` n'est
   pas encore applique.

### Open points that remain product/implementation decisions

- Le statut exact du `vendor` pendant le reajustement :
  `rejected` dans le code actuel, `suspended` dans la cible WED-22/WED-47.
- Le statut exact du `user` apres resoumission :
  retour a `under_review` ou maintien `suspended` jusqu'a validation finale.
- Le support visuel des pastilles de sections modifiees cote prestataire, pas
  seulement cote admin.
