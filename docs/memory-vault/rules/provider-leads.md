# Provider Lead Rules

## PROVIDER-LEAD-001 — Un lead appartient à un couple et cible un prestataire précis

Statut : `active`

Un `ProviderLead` représente une demande de mise en relation créée par un
`Couple` vers un `Vendor` précis. Il ne référence pas `app_user` directement :
les deux profils métier portent les données nécessaires au cycle de vie du lead.

À sa création lors de la finalisation de l'onboarding, le lead est :

- au statut `pending` ;
- d'origine `wedream` ;
- `unlocked = true` — la mise en relation est gratuite au lancement, décision
  produit confirmée le 21/08/2026 ; le verrouillage payant viendra plus tard.

Un simple épingle ne crée pas de `ProviderLead` : seule une demande de mise en
relation (« Je veux entrer en contact », WED-49) en produit un. La distinction
porte sur la création du lead, pas sur les écrans du parcours.

## PROVIDER-LEAD-002 — Le budget d'un lead est le budget global du mariage, figé à la création

Statut : `active`

Décision produit du 21/08/2026 : l'écran 6 de l'onboarding couple ne demande pas
un budget par prestataire mais **le budget global du mariage**, et il est
présenté à tous les couples quelle que soit la provenance — inscription directe
comme épingle. Tout couple doit pouvoir renseigner son budget.

L'écran 2 continue de proposer les cinq tranches du design source ; l'écran 6
affine cette tranche en un montant exact, en **saisie libre à l'euro près**, sans
pas imposé. Les deux valeurs coexistent dans l'état frontend :

- `budgetCents` — la médiane de la tranche, seule valeur que le curseur de
  l'écran 2 sait représenter ;
- `exactBudgetCents` — le montant tapé à l'écran 6, s'il l'a été.

Le montant porté à `Wedding.budgetCents` et au lead est `exactBudgetCents` quand
il existe, la médiane de la tranche sinon (`weddingBudgetCents()`).

Une saisie **vide ou aberrante** à l'écran 6 — champ laissé vide, `-`, montant
négatif ou nul — ne conserve pas le dernier montant et n'invente pas de plancher :
elle **efface** `exactBudgetCents`, ce qui ramène le budget à la tranche choisie
à l'écran 2 (arbitrage de Denis du 23/08/2026). Un mariage à 0 € ne qualifierait
rien pour un prestataire, et un plancher à 1 € serait un montant que le couple
n'a jamais donné. Le montant reste converti à la sortie du champ, jamais à la
frappe. Écrire le
montant exact dans `budgetCents` renverrait le curseur de l'écran 2 à sa valeur
par défaut, un montant libre n'étant jamais l'une des cinq graduations.

`provider_lead.budget_cents` garde sa **propre copie** du montant plutôt que de
lire `Wedding.budgetCents` à travers le couple : il qualifie la demande telle
qu'elle a été transmise au prestataire, et un couple qui révise son budget plus
tard ne doit pas réécrire silencieusement un lead déjà en cours de traitement.

## PROVIDER-LEAD-003 — Le budget est borné à 1 000 000 €

Statut : `active`

`budget_cents` est un `integer` PostgreSQL, plafonné à 2 147 483 647. Le montant
est saisi librement puis porté par l'état frontend jusqu'à la soumission finale :
il arrive donc côté serveur depuis une source non fiable et doit être borné des
deux côtés.

La borne retenue est `ProviderLead::MAX_BUDGET_CENTS` = `100 000 000` centimes
(1 000 000 €), validée par Wendy le 21/08/2026. C'est un garde-fou technique et
non une règle produit : sans elle, un montant absurde échouerait à l'insertion
au lieu d'être refusé à la saisie.

Un montant hors bornes est refusé par le constructeur de `ProviderLead`. Le DTO
de l'écran final (Stage D / WED-109) doit porter la contrainte `Assert`
équivalente, et revalider le `vendorId` — prestataire existant et actif — pour
répondre en 422 plutôt qu'en 500.

Implémentation actuelle :

- `apps/api/src/Entity/ProviderLead/ProviderLead.php`
- `apps/api/src/Enum/ProviderLead/ProviderLeadStatus.php`
- `apps/api/src/Enum/ProviderLead/ProviderLeadOrigin.php`
- `apps/api/migrations/Version20260819110000.php`
- `apps/web/lib/couple-onboarding-store.ts`
- `apps/web/app/couple-onboarding/navigation.ts`

Couverture attendue :

- test unitaire de l'état de création et des bornes du budget ;
- tests de navigation frontend : écran budget présenté sur les deux chemins,
  retour arrière vers l'écran réellement affiché ;
- E2E lorsque WED-49 et l'écran final d'authentification seront raccordés.
