<?php

declare(strict_types=1);

namespace App\Controller\Specialty;

use App\DTO\Specialty\SpecialtyResponseDto;
use App\Entity\Vendor\Specialty;
use App\Repository\Vendor\SpecialtyRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetSpecialtiesAction
{
    public function __construct(
        private SpecialtyRepository $specialtyRepository,
    ) {}

    #[Route('/api/v1/specialties', name: 'api_specialties_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $specialties = array_map(
            fn(Specialty $specialty) => new SpecialtyResponseDto($specialty),
            $this->specialtyRepository->findAllOrderedBySortOrder()
        );

        return new JsonResponse($specialties);
    }
}
