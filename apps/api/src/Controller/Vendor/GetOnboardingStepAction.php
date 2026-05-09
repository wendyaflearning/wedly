<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\Service\InviteTokenService;
use App\Vendor\DTO\Response\OnboardingDataResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/onboarding/{token}', name: 'api_get_onboarding_data', methods: ['GET'])]
readonly class GetOnboardingStepAction
{
    public function __construct(
        private InviteTokenService $inviteTokenService,
    ) {}

    public function __invoke(string $token): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);

            $vendor = $inviteToken->getVendor();
            if (null === $vendor) {
                return new JsonResponse(['error' => 'Aucun prestataire associé à ce token'], 404);
            }

            return new JsonResponse(OnboardingDataResponse::fromVendor($vendor));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
