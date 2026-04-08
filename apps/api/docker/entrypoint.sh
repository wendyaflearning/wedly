#!/bin/sh
set -e

echo "--- Debug Environnement ---"
# Affiche la valeur REELLE reçue par le container (pour vérification)
# On utilise 'sed' pour masquer le mot de passe mais voir les caractères spéciaux
echo "DATABASE_URL brut: $(echo $DATABASE_URL | sed 's/:\(.*\)@/:****@/')"

echo "Nettoyage du cache..."
rm -rf /var/www/html/var/cache/*

# On s'assure que les dossiers existent et appartiennent à www-data
mkdir -p /var/www/html/var/cache /var/www/html/var/log
chown -R www-data:www-data /var/www/html/var

# On saute le warmup pour l'instant pour laisser le container démarrer
# su -s /bin/sh www-data -c "php bin/console cache:warmup --env=prod --no-debug"

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf