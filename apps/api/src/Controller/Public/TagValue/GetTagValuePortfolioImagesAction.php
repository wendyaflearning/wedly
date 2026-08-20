<?php

declare(strict_types=1);

namespace App\Controller\Public\TagValue;

use App\DTO\Public\PortfolioImage\PublicPortfolioImageResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\TagValueRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\UuidV7;

/**
 * Galerie de découverte Wedream : les photos publiques d'un sous-style, sans compte.
 */
final readonly class GetTagValuePortfolioImagesAction
{
    private const DEFAULT_LIMIT     = 24;
    private const MIN_LIMIT         = 1;
    private const MAX_LIMIT         = 48;

    public function __construct(
        private TagValueRepository $tagValueRepository,
        private PortfolioImageRepository $portfolioImageRepository,
    ) {}

    #[Route(
        '/api/v1/tag-values/{tagValueId}/portfolio-images',
        name: 'api_public_tag_value_portfolio_images',
        requirements: ['tagValueId' => '[0-9a-fA-F-]{36}'],
        methods: ['GET'],
    )]
    public function __invoke(string $tagValueId, Request $request): JsonResponse
    {
        $tagValue = $this->tagValueRepository->find($tagValueId);
        if ($tagValue === null || !$tagValue->isActive()) {
            return new JsonResponse(['error' => 'Sous-style introuvable.'], 404);
        }

        // getInt() lèverait une BadRequestException sur une valeur non numérique :
        // un limit illisible retombe silencieusement sur la valeur par défaut.
        $rawLimit = $request->query->get('limit');
        $limit    = is_numeric($rawLimit) ? (int) $rawLimit : self::DEFAULT_LIMIT;
        $limit    = max(self::MIN_LIMIT, min(self::MAX_LIMIT, $limit));

        $rawCursor = $request->query->get('cursor');
        $cursor    = null;
        if ($rawCursor !== null && $rawCursor !== '') {
            try {
                $cursor = UuidV7::fromString($rawCursor);
            } catch (\InvalidArgumentException) {
                return new JsonResponse(['error' => 'Curseur invalide.'], 400);
            }
        }

        // On demande un élément de plus que la page : sa présence suffit à savoir
        // qu'une page suivante existe, sans COUNT supplémentaire par requête.
        $images  = $this->portfolioImageRepository->findPublicByTagValue($tagValue, $cursor, $limit + 1);
        $hasMore = count($images) > $limit;
        if ($hasMore) {
            array_pop($images);
        }

        $lastImage = end($images);

        return new JsonResponse([
            'items' => array_map(
                static fn(PortfolioImage $image) => new PublicPortfolioImageResponseDto($image),
                $images,
            ),
            'nextCursor' => $hasMore && $lastImage !== false ? $lastImage->getId()->toRfc4122() : null,
            'total'      => $this->portfolioImageRepository->countByTagValue($tagValue),
        ]);
    }
}
