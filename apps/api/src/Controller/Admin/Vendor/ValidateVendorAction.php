<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorReviewService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}/validate', name: 'api_admin_vendor_validate', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
final readonly class ValidateVendorAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private AdminVendorReviewService $reviewService,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if (null === $vendor) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        $this->reviewService->validate($vendor);

        return new JsonResponse(['message' => 'Prestataire validé.', 'status' => 'active'], 200);
    }
}
