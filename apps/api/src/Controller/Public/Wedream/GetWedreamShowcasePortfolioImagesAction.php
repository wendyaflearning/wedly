<?php

declare(strict_types=1);

namespace App\Controller\Public\Wedream;

use App\DTO\Public\PortfolioImage\PublicPortfolioImageResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Repository\Vendor\PortfolioImageRepository;
use App\ValueObject\CursorPagination;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Vitrine Wedream de la home publique : un échantillon de photos visibles
 * dans Wedream, toutes catégories confondues, sans compte. Pas de curseur —
 * jeu fixe pour un teaser, pas une galerie paginée.
 */
final readonly class GetWedreamShowcasePortfolioImagesAction
{
    public function __construct(
        private PortfolioImageRepository $portfolioImageRepository,
    ) {}

    #[Route(
        '/api/v1/wedream/portfolio-images/showcase',
        name: 'api_public_wedream_portfolio_images_showcase',
        methods: ['GET'],
    )]
    public function __invoke(CursorPagination $pagination): JsonResponse
    {
        $images = $this->portfolioImageRepository->findWedreamShowcase($pagination->limit);

        return new JsonResponse([
            'items' => array_map(
                static fn(PortfolioImage $image) => new PublicPortfolioImageResponseDto($image),
                $images,
            ),
        ]);
    }
}
