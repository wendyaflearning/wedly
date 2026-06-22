<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\RejectVendorRequestDto;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorReviewService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}/reject', name: 'api_admin_vendor_reject', methods: ['POST'])]
final readonly class RejectVendorAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private AdminVendorReviewService $reviewService,
    ) {}

    public function __invoke(string $id, Request $request): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        try {
            $dto = RejectVendorRequestDto::fromArray(json_decode($request->getContent(), true) ?? []);
            $this->reviewService->reject($vendor, $dto->reasons, $dto->note);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(['message' => 'Vendor rejected.', 'status' => 'rejected'], 200);
    }
}
