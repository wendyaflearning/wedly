<?php

declare(strict_types=1);

namespace App\Controller\Culture;

use App\DTO\Culture\CultureResponseDto;
use App\Entity\Culture\Culture;
use App\Repository\Culture\CultureRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetCulturesAction
{
    public function __construct(
        private CultureRepository $cultureRepository,
    ) {}

    #[Route('/api/v1/cultures', name: 'api_cultures_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $cultures = array_map(
            fn(Culture $culture) => new CultureResponseDto($culture),
            $this->cultureRepository->findContinents()
        );

        return new JsonResponse($cultures);
    }
}
