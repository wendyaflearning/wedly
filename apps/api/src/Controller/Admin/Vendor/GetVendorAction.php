<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorProfileResponseDto;
use App\Repository\Vendor\VendorRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}', name: 'api_admin_vendor_get', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
final readonly class GetVendorAction
{
    public function __construct(private VendorRepository $vendorRepository) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->findAdminProfile($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        return new JsonResponse(new AdminVendorProfileResponseDto($vendor));
    }
}
