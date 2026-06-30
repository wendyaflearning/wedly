<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorInvitationListResponseDto;
use App\Service\Vendor\AdminVendorInvitationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/admin/vendor-invitations', name: 'api_admin_vendor_invitation_list', methods: ['GET'])]
#[IsGranted('ROLE_ADMIN')]
final readonly class ListVendorInvitationsAction
{
    public function __construct(private AdminVendorInvitationService $invitationService) {}

    public function __invoke(Request $request): JsonResponse
    {
        $scope = $request->query->get('scope', 'active');

        try {
            return new JsonResponse(new AdminVendorInvitationListResponseDto($this->invitationService->list($scope)));
        } catch (\DomainException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], $exception->getCode());
        }
    }
}
