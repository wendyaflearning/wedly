<?php

declare(strict_types=1);

namespace App\Controller\Region;

use App\DTO\Region\RegionResponseDto;
use App\Entity\Region\Region;
use App\Repository\Region\RegionRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetRegionsAction
{
    public function __construct(
        private RegionRepository $regionRepository,
    ) {}

    #[Route('/api/v1/regions', name: 'api_regions_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $regions = array_map(
            fn(Region $region) => new RegionResponseDto($region),
            $this->regionRepository->findBy([], ['name' => 'ASC'])
        );

        return new JsonResponse($regions);
    }
}
