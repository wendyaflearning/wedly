<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorDraftService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/admin/vendors/{id}/draft', name: 'api_admin_vendor_draft_get', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['GET'])]
#[IsGranted('ROLE_ADMIN')]
final readonly class GetVendorDraftAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private AdminVendorDraftService $draftService,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->findAdminProfile($id);
        if ($vendor === null) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        return new JsonResponse($this->draftService->get($vendor));
    }
}
