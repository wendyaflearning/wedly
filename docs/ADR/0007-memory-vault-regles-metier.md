# ADR-0007 — Memory Vault pour les règles métier

**Date :** 28 juin 2026  
**Statut :** Accepté

## Contexte

Wedly commence à accumuler des règles métier autour de l'onboarding
prestataire, des invitations, de la validation admin, des référentiels et des
conventions de données.

Ces règles existent déjà dans le code et les tests, mais certaines restent
implicites. Avec le temps, une règle implicite devient difficile à auditer :
elle peut être modifiée par accident, testée partiellement ou dupliquée dans un
autre module.

## Décision

Créer un Memory Vault dans `docs/memory-vault/`.

Le vault devient le registre vivant des règles métier actives, de leurs points
d'application dans le code, de leur couverture de tests et des risques de
régression associés.

## Justification

- les règles métier doivent être visibles avant d'être modifiées
- les futures PR doivent pouvoir vérifier si elles changent un contrat existant
- les audits réguliers doivent comparer le vault, le code, les tests et le
comportement réel
- les règles importantes doivent être reliées aux tests unitaires et aux futurs
tests E2E

## Conséquences

- toute modification métier significative doit vérifier si une entrée du vault
doit être ajoutée ou mise à jour
- une règle non couverte par test doit être explicitement justifiée
- les audits utilisent `docs/memory-vault/audit-template.md`
- le vault ne remplace pas les ADR : les ADR documentent les décisions
d'architecture, le vault documente les règles métier opérationnelles

## Alternatives écartées

**Tout garder dans les ADR** — les ADR sont adaptées aux décisions structurantes,
mais moins aux règles métier nombreuses et évolutives.

**Tout garder dans les tests** — les tests protègent le comportement, mais ne
donnent pas toujours le contexte produit ni les risques à auditer.

**Tout garder dans les tickets GitHub** — les tickets expliquent une décision à
un instant donné, mais ne constituent pas une source durable et facilement
auditable.
