<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard;

use App\DTO\Vendor\Dashboard\WedreamVisibilityRequestDto;
use App\Entity\User\User;
use App\Service\Vendor\VendorOwnershipResolver;
use App\Service\Vendor\VendorWedreamVisibilityService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route(
    '/api/v1/vendors/me/wedream-visibility',
    name: 'api_vendor_dashboard_wedream_visibility',
    methods: ['PATCH'],
)]
final readonly class PatchVendorDashboardWedreamVisibilityAction
{
    public function __construct(
        private Security                       $security,
        private VendorOwnershipResolver        $vendorOwnershipResolver,
        private VendorWedreamVisibilityService $wedreamVisibilityService,
    ) {}

    public function __invoke(#[MapRequestPayload] WedreamVisibilityRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $this->wedreamVisibilityService->setVisibility($vendor, $dto->enabled);

        return new JsonResponse(['wedream_enabled' => $vendor->isWedreamEnabled()], 200);
    }
}
