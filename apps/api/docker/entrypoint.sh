#!/bin/sh
set -e

echo "Warming up Symfony cache..."
php bin/console cache:warmup --env=prod --no-debug

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
