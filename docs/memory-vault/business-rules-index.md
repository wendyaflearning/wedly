# Business Rules Index

Ce fichier sert d'index rapide. Les détails et preuves de couverture restent
dans les fichiers de règles.

## Vendor onboarding

| ID | Règle | Statut | Fichier |
|---|---|---|---|
| `VENDOR-ONBOARDING-001` | Les steps disponibles dépendent du type de prestataire | `active` | `rules/vendor-onboarding.md` |
| `VENDOR-ONBOARDING-002` | La soumission finale est bloquée tant que les steps obligatoires ne sont pas remplies | `active` | `rules/vendor-onboarding.md` |
| `VENDOR-ONBOARDING-003` | Les `steps_data` sont produits par les handlers de steps | `active` | `rules/vendor-onboarding.md` |
| `VENDOR-ONBOARDING-004` | Pappers inaccessible ne signifie pas entreprise inactive | `active` | `rules/vendor-onboarding.md` |
| `VENDOR-ONBOARDING-005` | Les steps sensibles sont filtrées si le consentement RGPD n'est pas accordé | `active` | `rules/vendor-onboarding.md` |

## RGPD consent

| ID | Règle | Statut | Fichier |
|---|---|---|---|
| `RGPD-CONSENT-001` | Le consentement données sensibles est explicite avant collecte cultures/confessions | `active` | `rules/rgpd-consent.md` |
| `RGPD-CONSENT-002` | Refuser le consentement saute la step expériences et ne bloque pas la soumission finale | `active` | `rules/rgpd-consent.md` |
| `RGPD-CONSENT-003` | Le payload de consentement exige un booléen natif | `active` | `rules/rgpd-consent.md` |
| `RGPD-CONSENT-004` | Le consentement profil est limité au vendor propriétaire et crée une entrée datée | `active` | `rules/rgpd-consent.md` |
| `RGPD-CONSENT-005` | La sémantique historique vs dernier état doit être clarifiée | `at-risk` | `rules/rgpd-consent.md` |

## Admin vendor lifecycle

| ID | Règle | Statut | Fichier |
|---|---|---|---|
| `ADMIN-VENDOR-001` | Un brouillon prestataire utilisé via invitation ne peut plus être édité | `active` | `rules/admin-vendor-lifecycle.md` |
| `ADMIN-VENDOR-002` | Une invitation prestataire requiert les données coeur du brouillon | `active` | `rules/admin-vendor-lifecycle.md` |
| `ADMIN-VENDOR-003` | Valider un prestataire active le vendor, publie son profil et active son user | `active` | `rules/admin-vendor-lifecycle.md` |
| `ADMIN-VENDOR-004` | Rejeter un prestataire suspend son user, dépublie son profil et exige au moins une raison | `active` | `rules/admin-vendor-lifecycle.md` |

## Invite tokens

| ID | Règle | Statut | Fichier |
|---|---|---|---|
| `INVITE-TOKEN-001` | Seul un token `Pending` et non expiré peut être résolu | `active` | `rules/invite-tokens.md` |
| `INVITE-TOKEN-002` | Un token expiré est marqué `Expired` lors de sa résolution | `active` | `rules/invite-tokens.md` |
| `INVITE-TOKEN-003` | Un token consommé passe à `Used` | `active` | `rules/invite-tokens.md` |

## Data and schema

| ID | Règle | Statut | Fichier |
|---|---|---|---|
| `DATA-SCHEMA-001` | Les montants sont stockés en centimes entiers | `active` | `rules/data-and-schema.md` |
| `DATA-SCHEMA-002` | `PLAN.category_count = -1` signifie illimité | `active` | `rules/data-and-schema.md` |
| `DATA-SCHEMA-003` | Les ManyToMany doivent passer par des tables de jointure explicites | `active` | `rules/data-and-schema.md` |
| `DATA-SCHEMA-004` | Les référentiels sont chargés par fixtures, pas par API métier | `active` | `rules/data-and-schema.md` |
| `DATA-SCHEMA-005` | `vendor_consent` conserve les décisions de consentement par vendor | `active` | `rules/data-and-schema.md` |

## Tag taxonomy (admin)

| ID                 | Règle                                                    | Statut   | Fichier                 |
| ------------------ | -------------------------------------------------------- | -------- | ----------------------- |
| `TAG-TAXONOMY-001` | Une seule catégorie principale active par métier         | `active` | `rules/tag-taxonomy.md` |
| `TAG-TAXONOMY-002` | Désactivation sans cascade, jamais de suppression réelle | `active` | `rules/tag-taxonomy.md` |

## À ajouter lors des prochains tickets

- règles WedMatch dès que le matching est implémenté
- règles couple, wedding et subscription au moment de leur implémentation réelle
- règles frontend de navigation, formulaires et permissions quand les parcours seront stabilisés
