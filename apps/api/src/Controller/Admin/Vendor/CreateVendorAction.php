<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Vendor\CreateVendorInputDto;
use App\Service\Vendor\VendorService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class CreateVendorAction
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorService $vendorService,
    ) {}

    #[IsGranted('ROLE_ADMIN')]
    #[Route('/api/v1/admin/vendors', name: 'api_admin_vendor_create', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] CreateVendorInputDto $dto): JsonResponse
    {
        if (null === $adminUser = $this->security->getUser()) {
            throw new \RuntimeException('Authenticated user could not be resolved.');
        }

        try {
            return new JsonResponse(
                $this->vendorService->createVendor($dto, $adminUser),
                201
            );
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
