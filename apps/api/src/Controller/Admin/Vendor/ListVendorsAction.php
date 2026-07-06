<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorListResponseDto;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\VendorRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors', name: 'api_admin_vendor_list', methods: ['GET'])]
final readonly class ListVendorsAction
{
    public function __construct(private VendorRepository $vendorRepository) {}

    public function __invoke(Request $request): JsonResponse
    {
        $status = VendorStatus::fromAdminFilter($request->query->get('status', VendorStatus::UnderReview->value));
        if ($status === false) {
            return new JsonResponse(['error' => 'Filtre de statut invalide.'], 422);
        }

        $vendors  = $this->vendorRepository->findForAdminReview($status);
        $totalAll = $this->vendorRepository->countAdminReviewableVendors();

        return new JsonResponse(new AdminVendorListResponseDto($vendors, $totalAll));
    }
}
