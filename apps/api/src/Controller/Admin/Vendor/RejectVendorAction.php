<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\RejectVendorRequestDto;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorReviewService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}/reject', name: 'api_admin_vendor_reject', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
final readonly class RejectVendorAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private AdminVendorReviewService $reviewService,
    ) {}

    public function __invoke(string $id, #[MapRequestPayload] RejectVendorRequestDto $dto): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        try {
            $this->reviewService->reject($vendor, $dto->reasons, $dto->note);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(['message' => 'Prestataire refusé.', 'status' => 'rejected'], 200);
    }
}
