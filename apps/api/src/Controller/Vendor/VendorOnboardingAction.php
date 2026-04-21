<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\DTO\Vendor\VendorOnboardingResponse;
use App\Service\InviteTokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

readonly class VendorOnboardingAction
{
    public function __construct(
        private InviteTokenService $inviteTokenService,
    ) {}

    #[Route('/api/v1/onboarding/{token}', name: 'api_vendor_onboarding', methods: ['GET'])]
    public function __invoke(string $token): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);
            $vendor = $inviteToken->getVendor();

            if (null === $vendor) {
                throw new \DomainException('Aucun prestataire associé à ce token', 422);
            }

            return new JsonResponse(new VendorOnboardingResponse($vendor));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
