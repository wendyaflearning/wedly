# Infrastructure VPS

## docker-compose.vps.yml
Source de vérité de tous les services qui tournent sur le VPS Wedly.

En cas de restauration :
1. Copier ce fichier vers `/root/docker-compose.yml` sur le nouveau VPS
2. Recréer le `/root/.env` avec les vraies valeurs
3. Copier les clés JWT vers `/root/config/jwt/`
4. `docker compose up -d`

## ⚠️ Ne jamais commiter
- Les vraies valeurs des variables d'env → restent dans `/root/.env` sur le VPS
- Les clés JWT (.pem) → restent dans `/root/config/jwt/` sur le VPS
