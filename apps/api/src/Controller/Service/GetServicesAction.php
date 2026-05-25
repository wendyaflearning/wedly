<?php

declare(strict_types=1);

namespace App\Controller\Service;

use App\DTO\Service\ServiceResponseDto;
use App\Entity\Vendor\Service;
use App\Repository\Vendor\ServiceRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GetServicesAction
{
    public function __construct(
        private ServiceRepository $serviceRepository,
    ) {}

    #[Route('/api/v1/services', name: 'api_services_list', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $services = array_map(
            fn(Service $service) => new ServiceResponseDto($service),
            $this->serviceRepository->findRootsWithChildren()
        );

        return new JsonResponse($services);
    }
}
