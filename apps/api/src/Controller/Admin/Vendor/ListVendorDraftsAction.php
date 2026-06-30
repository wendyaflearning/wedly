<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftListResponseDto;
use App\Repository\Vendor\VendorRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/admin/vendors/drafts', name: 'api_admin_vendor_draft_list', methods: ['GET'])]
#[IsGranted('ROLE_ADMIN')]
final readonly class ListVendorDraftsAction
{
    public function __construct(private VendorRepository $vendorRepository) {}

    public function __invoke(): JsonResponse
    {
        return new JsonResponse(new AdminVendorDraftListResponseDto($this->vendorRepository->findAdminDrafts()));
    }
}
