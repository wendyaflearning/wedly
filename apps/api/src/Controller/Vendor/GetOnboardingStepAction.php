<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\Builder\Vendor\Onboarding\VendorOnboardingOverviewBuilder;
use App\Service\InviteTokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/onboarding/{token}', name: 'api_get_onboarding_data', methods: ['GET'])]
readonly class GetOnboardingStepAction
{
    public function __construct(
        private InviteTokenService              $inviteTokenService,
        private VendorOnboardingOverviewBuilder $overviewBuilder,
    ) {}

    public function __invoke(string $token): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);

            $vendor = $inviteToken->getVendor();
            if (null === $vendor) {
                return new JsonResponse(['error' => 'Aucun prestataire associé à ce token'], 404);
            }

            if (empty($vendor->resolveVendorServices())) {
                return new JsonResponse(['error' => 'Aucun service n\'a été associé à ce prestataire'], 422);
            }

            return new JsonResponse($this->overviewBuilder->build($vendor));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
