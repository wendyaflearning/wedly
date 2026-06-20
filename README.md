# Wedly

Wedly est un monorepo qui regroupe une application web et une API autour d'une plateforme SaaS mariage. Le projet couvre notamment la vitrine produit, l'authentification, l'onboarding prestataire par étapes, ainsi qu'un espace prestataire avec dashboard.

## Structure du projet

```text
apps/
  api/   Backend Symfony
  web/   Frontend Next.js
.github/workflows/
  deploy.yml
infra/
  docker-compose.vps.yml
docs/
  ADR/
```

## Description rapide

- `apps/web` expose l'interface utilisateur en Next.js.
- `apps/api` expose l'API métier en Symfony.
- Le domaine métier visible dans le code tourne autour de :
  - l'onboarding prestataire par token
  - l'authentification JWT
  - le dashboard prestataire
  - des référentiels comme services, cultures, régions et confessions
- Les ADR dans `docs/ADR` indiquent que le projet vise une plateforme mariage construite autour de `Wedplan`, `WedWallet` et `WedMatch`.

## Guide d'installation

## Prérequis

- Node.js 20+
- npm
- PHP 8.2+ (`8.3` recommandé, utilisé dans le pipeline)
- Composer 2
- Docker + Docker Compose

## 1. Cloner le dépôt

```bash
git clone <repo-url>
cd wedly
```

## 2. Démarrer l'API Symfony

La base PostgreSQL locale est fournie via Docker Compose dans `apps/api`.

```bash
cd apps/api
docker compose up -d
composer install
php bin/console doctrine:migrations:migrate
symfony server:start --no-tls
```

Points utiles :

- La configuration par défaut utilise PostgreSQL sur `127.0.0.1:5432`.
- Le Mailer de dev passe par Mailpit via `compose.override.yaml`.
- Les variables d'environnement backend sont définies dans `apps/api/.env`, avec surcharge possible via `.env.local`.

Variables backend notables :

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_PUBLIC_KEY`
- `JWT_PASSPHRASE`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAPPERS_API_TOKEN`
- `MAILER_DSN`
- `FRONTEND_URL`

## 3. Démarrer le frontend Next.js

Le frontend consomme l'API via `NEXT_PUBLIC_API_URL`.

```bash
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 npm run dev
```

Ensuite :

- frontend : `http://localhost:3000`
- API Symfony locale : en général `http://127.0.0.1:8000`
- Mailpit : `http://localhost:8025`

## 4. Vérifications utiles

Frontend :

```bash
cd apps/web
npm run lint
```

Backend :

```bash
cd apps/api
php bin/phpunit
```

## Technologies utilisées

## Frontend

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript
- Tailwind CSS `v4`
- Lucide React

## Backend

- Symfony `7.4`
- PHP `8.2+`
- Doctrine ORM
- Doctrine Migrations
- PostgreSQL `16`
- LexikJWTAuthenticationBundle
- NelmioCorsBundle
- Symfony Mailer
- Cloudinary SDK

## Infra / déploiement

- Docker
- GitHub Actions
- GitHub Container Registry (`ghcr.io`)
- VPS avec Docker Compose
- Traefik côté infra VPS

## Gestion du pipeline GitHub Actions

Le dépôt contient actuellement un workflow : [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

## Ce que fait le workflow

Nom du workflow : `Deploy to VPS`

Déclenchement :

- sur `push`
- branches :
  - `develop`
  - `feature/feature/ci-migrations`
- seulement si certains fichiers changent :
  - `apps/api/**`
  - `.github/workflows/**`
  - `composer.json`
  - `composer.lock`

Étapes exécutées :

1. checkout du code
2. installation de PHP `8.3`
3. `composer install --no-dev --optimize-autoloader --no-scripts` dans `apps/api`
4. connexion à `ghcr.io`
5. build et push de l'image Docker `ghcr.io/<owner>/wedly-api:latest`
6. connexion SSH au VPS
7. écriture d'un fichier d'environnement `/root/.env.wedly` à partir des secrets GitHub
8. déploiement sur le VPS :
   - `docker compose pull symfony`
   - exécution des migrations Doctrine
   - `cache:clear`
   - redémarrage du service `symfony`

## Secrets attendus par le workflow

- `SSH_PRIVATE_KEY`
- `VPS_HOST`
- `VPS_USER`
- `APP_SECRET`
- `DATABASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAPPERS_API_TOKEN`
- `MAILER_DSN`

## Limites actuelles du pipeline

- Le workflow ne déploie que `apps/api`.
- Aucun job de test ou de lint n'est exécuté avant le déploiement.
- Aucun workflow GitHub Actions frontend n'est présent dans le dépôt.
- D'après l'ADR monorepo, le frontend semble destiné à Vercel, mais ce déploiement n'est pas géré ici par GitHub Actions.

## Notes complémentaires

- `infra/docker-compose.vps.yml` documente la stack VPS cible autour de Traefik, PostgreSQL et du conteneur `symfony`.
- `docs/ADR` contient les décisions d'architecture utiles pour comprendre les choix de stack et de structure.

