# ADR-0001 — Choix de l'architecture monorepo et de la stack technique

## Statut
Accepté — avril 2026

## Contexte
Wedly - Plateforme Saas avec 3 piliers : Wedplan, Wedwallet et le Wedmatch
Système de match via multi-critères : disponiblités, budget, zone, style, culture, confession 

## Décisions

### 1. Monorepo unique (apps/api + apps/web)
**Choix retenu : Monorepo
**Alternatives écartées : Deux repos distincts
**Raisons : En stade de MVP, maintenir deux repos distincts est chronophage et complexe. Cela se traduisait par déployé deux CI/CD (pipelines), commiter sur deux repos différents. En developpement solo à ce stade, cela n'a pas de sens

### 2. Symfony 7.4 LTS comme backend
**Choix retenu** : Symfony 7.4
**Alternatives écartées** : NestJS, Next.JS
**Raisons :** Framework robuste, structée et offrant un cadre de tavail clair. Dans le cas de Wedly il permet une séparation de domaines métiers claires et offre pleins d'outils et composants permettant d'éviter de reinventer la roue. Il s'agit également de la stack que je maîtrise pour éviter une courbe d'apprentissage

### 3. NextJS + Vercel
**Choix retenu** : NextJS
**Alternatives écartées** : Twig
**Raisons :**  c'est un réseau de distribution mondial (CDN + Edge). Quand un couple à Marseille ouvre Wedly, il est servi depuis le serveur Vercel le plus proche de lui, pas depuis ton VPS à Amsterdam. Résultat : temps de chargement quasi instantané.

### 4. PostgreSQL comme base de données
**Choix retenu :** PostgreSQL
**Alternatives écartées :** MongoDB
**Raisons :** Le matching Wedmatch nécessite des jointures multi-critères sur 5-6 dimensions simultanées — budget, zone, style, confession, disponibilité, catégorie de service. Ce type de requête avec des filtres combinés et des conditions d'exclusion est nativement expressif en SQL. Avec MongoDB, ce même matching aurait nécessité plusieurs agrégations imbriquées — c'est faisable mais structurellement moins adapté à un modèle fortement relationnel

## Conséquences
**Positives :** Démarrage du projet rapide
**Risques acceptés :**

## Révision prévue
À réévaluer si le nombre de développeurs dépasse 3 
ou si les performances du matching nécessitent 
une couche cache dédiée (Redis).
- Évaluer le passage à un scaling horizontal
  si la charge dépasse 10k utilisateurs actifs
- Introduire Redis comme couche cache
  avant de scaler horizontalement
