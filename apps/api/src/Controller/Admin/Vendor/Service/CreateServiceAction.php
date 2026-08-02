<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\Service;

use App\DTO\Service\ServiceResponseDto;
use App\DTO\Vendor\CreateServiceInputDto;
use App\Service\Vendor\AdminVendorService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendor/services', name: 'api_admin_vendor_service_create', methods: ['POST'])]
final readonly class CreateServiceAction
{
    public function __construct(
        private AdminVendorService $serviceCatalogService,
    ) {}

    public function __invoke(#[MapRequestPayload] CreateServiceInputDto $dto): JsonResponse
    {
        $service = $this->serviceCatalogService->create($dto);

        return new JsonResponse(new ServiceResponseDto($service), 201);
    }
}
