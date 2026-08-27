<?php

declare(strict_types=1);

namespace App\ArgumentResolver;

use App\ValueObject\CursorPagination;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;
use Symfony\Component\Uid\UuidV7;

/**
 * Construit un CursorPagination depuis la query string d'une requête.
 *
 * Autoconfiguré : tout controller qui type-hint CursorPagination le reçoit
 * sans câblage supplémentaire.
 */
final readonly class CursorPaginationValueResolver implements ValueResolverInterface
{
    /** @return iterable<CursorPagination> */
    public function resolve(Request $request, ArgumentMetadata $argument): iterable
    {
        if ($argument->getType() !== CursorPagination::class) {
            return [];
        }

        // getInt() lèverait une BadRequestException sur une valeur non numérique :
        // un limit illisible retombe silencieusement sur la valeur par défaut.
        $rawLimit = $request->query->get('limit');
        $limit    = is_numeric($rawLimit) ? (int) $rawLimit : CursorPagination::DEFAULT_LIMIT;
        $limit    = max(CursorPagination::MIN_LIMIT, min(CursorPagination::MAX_LIMIT, $limit));

        $rawCursor = $request->query->get('cursor');
        $cursor    = null;
        if ($rawCursor !== null && $rawCursor !== '') {
            try {
                $cursor = UuidV7::fromString($rawCursor);
            } catch (\InvalidArgumentException) {
                throw new \DomainException('Curseur invalide.', 400);
            }
        }

        return [new CursorPagination($limit, $cursor)];
    }
}
