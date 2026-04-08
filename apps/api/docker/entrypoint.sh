#!/bin/sh
set -e

echo "Warming up Symfony cache..."
echo "APP_SECRET is: $(if [ -z "$APP_SECRET" ]; then echo 'VIDE ⚠️'; else echo 'défini ✅'; fi)"
echo "DATABASE_URL is: $(if [ -z "$DATABASE_URL" ]; then echo 'VIDE ⚠️'; else echo 'défini ✅'; fi)"

rm -rf var/cache/prod
chown -R www-data:www-data var/
chmod -R 775 var/

su -s /bin/sh www-data -c "php bin/console cache:warmup --env=prod --no-debug"

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf