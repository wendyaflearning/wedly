<?php

declare(strict_types=1);

namespace App\ValueObject;

use Symfony\Component\Uid\UuidV7;

/**
 * Paramètres de pagination par curseur, communs aux endpoints paginés.
 *
 * Le curseur est un UUIDv7 : trié chronologiquement, il suffit à lui seul à
 * repérer la position dans la liste, sans offset ni tie-breaker.
 *
 * Construit par CursorPaginationValueResolver depuis la query string.
 */
final readonly class CursorPagination
{
    public const DEFAULT_LIMIT = 24;
    public const MIN_LIMIT     = 1;
    public const MAX_LIMIT     = 48;

    public function __construct(
        public int $limit = self::DEFAULT_LIMIT,
        public ?UuidV7 $cursor = null,
    ) {}
}
