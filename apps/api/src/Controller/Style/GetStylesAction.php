<?php

declare(strict_types=1);

namespace App\Controller\Style;

use App\DTO\Style\StyleResponseDto;
use App\Entity\Wedding\WeddingStyle;
use App\Repository\Wedding\WeddingStyleRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetStylesAction
{
    public function __construct(
        private WeddingStyleRepository $weddingStyleRepository,
    ) {}

    #[Route('/api/v1/styles', name: 'api_styles_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $styles = array_map(
            fn(WeddingStyle $style) => new StyleResponseDto($style),
            $this->weddingStyleRepository->findAllOrderedByName()
        );

        return new JsonResponse($styles);
    }
}
