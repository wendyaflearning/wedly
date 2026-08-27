<?php

declare(strict_types=1);

namespace App\Attribute;

/**
 * Marque un argument de controller à résoudre en TagValue public et actif.
 *
 * La résolution est faite par PublicActiveTagValueResolver, qui répond 404 si
 * le sous-style est introuvable ou désactivé.
 */
#[\Attribute(\Attribute::TARGET_PARAMETER)]
final class PublicActiveTagValue
{
    public function __construct(
        public string $routeParameter = 'tagValueId',
    ) {}
}
