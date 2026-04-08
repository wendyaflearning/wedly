#!/bin/sh
set -e

echo "Warming up Symfony cache..."
echo "APP_SECRET is: $(if [ -z "$APP_SECRET" ]; then echo 'VIDE ⚠️'; else echo 'défini ✅'; fi)"
echo "DATABASE_URL is: $(if [ -z "$DATABASE_URL" ]; then echo 'VIDE ⚠️'; else echo 'défini ✅'; fi)"

php bin/console cache:warmup --env=prod --no-debug

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf