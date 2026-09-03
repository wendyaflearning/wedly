<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\Service\Vendor\AdminVendorDraftService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/admin/vendors/drafts', name: 'api_admin_vendor_draft_create', methods: ['POST'])]
#[IsGranted('ROLE_ADMIN')]
final readonly class CreateVendorDraftAction
{
    public function __construct(private AdminVendorDraftService $draftService) {}

    public function __invoke(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true) ?? [];

        return new JsonResponse(
            $this->draftService->create(AdminVendorDraftRequestDto::fromArray($body)),
            201
        );
    }
}
