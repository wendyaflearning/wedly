# Stage 1 — Install and optimise Composer dependencies
FROM composer:2 AS vendor

WORKDIR /app

# AJOUT : Installation des outils pour ajouter l'extension XSL sous Alpine (l'image Composer de base)
RUN apk add --no-cache libxslt-dev \
    && docker-php-ext-install xsl

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative --no-dev


# Stage 2 — Production runtime
FROM php:8.3-fpm

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    libpq-dev \
    libicu-dev \
    libxml2-dev \
    libzip-dev \
    libcurl4-openssl-dev \
    libonig-dev \
    unzip \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*
# ^ AJOUT de libxslt1-dev dans la liste ci-dessus pour la production (Debian/Ubuntu)

# PHP extensions (tokenizer is built-in, no need to install)
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    xml \
    curl \
    intl \
    zip \
    xsl
# ^ AJOUT de xsl dans la liste ci-dessus

COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Composer binary (useful for bin/console and one-off commands in the container)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Application code (with pre-built vendor/ from stage 1)
COPY --from=vendor /app /var/www/html

WORKDIR /var/www/html

# Environment
ENV APP_ENV=prod
ENV APP_DEBUG=0
ARG APP_SECRET
ENV APP_SECRET=${APP_SECRET}

# Permissions
RUN mkdir -p var && chown -R www-data:www-data var/

# nginx configuration
RUN rm -f /etc/nginx/sites-enabled/default
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# supervisor configuration
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]