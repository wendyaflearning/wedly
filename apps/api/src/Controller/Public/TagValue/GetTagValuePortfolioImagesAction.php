<?php

declare(strict_types=1);

namespace App\Controller\Public\TagValue;

use App\Attribute\PublicActiveTagValue;
use App\DTO\Public\PortfolioImage\PublicPortfolioImageResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\PortfolioImageRepository;
use App\ValueObject\CursorPagination;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Galerie de découverte Wedream : les photos publiques d'un sous-style, sans compte.
 */
final readonly class GetTagValuePortfolioImagesAction
{
    public function __construct(
        private PortfolioImageRepository $portfolioImageRepository,
    ) {}

    #[Route(
        '/api/v1/tag-values/{tagValueId}/portfolio-images',
        name: 'api_public_tag_value_portfolio_images',
        requirements: ['tagValueId' => '[0-9a-fA-F-]{36}'],
        methods: ['GET'],
    )]
    public function __invoke(
        #[PublicActiveTagValue] TagValue $tagValue,
        CursorPagination $pagination,
    ): JsonResponse {
        // On demande un élément de plus que la page : sa présence suffit à savoir
        // qu'une page suivante existe, sans COUNT supplémentaire par requête.
        $images = $this->portfolioImageRepository->findPublicByTagValue(
            $tagValue,
            $pagination->cursor,
            $pagination->limit + 1,
        );

        $hasMore = count($images) > $pagination->limit;
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
