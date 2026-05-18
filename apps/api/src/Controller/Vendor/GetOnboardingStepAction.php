<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\Service\InviteTokenService;
use App\Service\Vendor\Onboarding\StepHandlerInterface;
use App\Vendor\DTO\Response\OnboardingOverviewResponseDto;
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/onboarding/{token}', name: 'api_get_onboarding_data', methods: ['GET'])]
readonly class GetOnboardingStepAction
{
    public function __construct(
        private InviteTokenService     $inviteTokenService,
        private OnboardingStepResolver $onboardingStepResolver,
        #[TaggedIterator('onboarding.step_handler')]
        private iterable $handlers,
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

            $vendorType    = VendorType::resolveVendorType($slugs);
            $lastCompleted = $vendor->getOnboardingStep();

            if ($lastCompleted === null) {
                $currentStep = OnboardingStep::Professions;
            } else {
                $currentStep = $this->onboardingStepResolver->resolveNextStep($vendorType, $lastCompleted)
                    ?? $lastCompleted;
            }

            $steps = $this->onboardingStepResolver->resolveAllSteps($vendorType, $currentStep);

            $stepsData = [];
            foreach ($this->onboardingStepResolver->getOnboardingSteps($vendorType) as $step) {
                foreach ($this->handlers as $handler) {
                    if ($handler->supports() === $step && $handler->supportsVendorType($vendorType)) {
                        $stepData = $handler->getStepData($vendor);
                        if (!empty($stepData)) {
                            $stepsData[$step->value] = $stepData;
                        }
                        break;
                    }
                }
            }

            return new JsonResponse(new OnboardingOverviewResponseDto(
                firstname:  $vendor->getUser()->getFirstName(),
                steps:      $steps,
                steps_data: $stepsData,
            ));
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
