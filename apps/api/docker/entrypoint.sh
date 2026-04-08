#!/bin/sh
set -e

# On s'assure que les dossiers de base existent
mkdir -p /var/www/html/var/cache /var/www/html/var/log

# ÉTAPE CRUCIALE : On donne tout à www-data
# On le fait de manière récursive sur le dossier var
chown -R www-data:www-data /var/www/html/var
chmod -R 775 /var/www/html/var

echo "Nettoyage du cache..."
# On vide le cache en tant que root pour être sûr,
# Symfony le reconstruira avec les bons droits au premier hit
rm -rf /var/www/html/var/cache/*

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf