<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\Service\InviteTokenService;
use App\Vendor\DTO\Response\OnboardingRecapResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/onboarding/{token}', name: 'api_get_onboarding_data', methods: ['GET'])]
readonly class GetOnboardingStepAction
{
    public function __construct(
        private InviteTokenService    $inviteTokenService,
        private OnboardingStepResolver $onboardingStepResolver,
    ) {}

    public function __invoke(string $token): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);

            $vendor = $inviteToken->getVendor();
            if (null === $vendor) {
                return new JsonResponse(['error' => 'Aucun prestataire associé à ce token'], 404);
            }

            $slugs = $vendor->resolveVendorServices();
            if (empty($slugs)) {
                return new JsonResponse(['error' => 'Type de prestataire non déterminable'], 422);
            }

            $vendorType  = VendorType::resolveVendorType($slugs);
            $currentStep = $vendor->getOnboardingStep() ?? OnboardingStep::Professions;

            $steps = $this->onboardingStepResolver->resolveAllSteps($vendorType, $currentStep);

            return new JsonResponse(new OnboardingRecapResponse(
                firstname: $vendor->getUser()->getFirstName(),
                steps:     $steps,
            ));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
