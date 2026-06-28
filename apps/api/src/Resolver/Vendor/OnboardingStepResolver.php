<?php

declare(strict_types=1);

namespace App\Resolver\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\DTO\Vendor\Onboarding\Response\OnboardingStepResponse;

readonly class OnboardingStepResolver
{
    /** @return array<OnboardingStep> */
    public function getOnboardingSteps(VendorType $vendorType): array
    {
        return match ($vendorType) {
            VendorType::Freelance => [
                OnboardingStep::Professions,
                OnboardingStep::Consent,
                OnboardingStep::Experiences,
                OnboardingStep::ZonesPricing,
                OnboardingStep::Portfolio,
                OnboardingStep::LegalInfo,
                OnboardingStep::Credentials,
            ],
            VendorType::Traiteur => [
                OnboardingStep::Professions,
                OnboardingStep::Consent,
                OnboardingStep::Experiences,
                OnboardingStep::CateringCharacteristics,
                OnboardingStep::ZonesPricing,
                OnboardingStep::Portfolio,
                OnboardingStep::LegalInfo,
                OnboardingStep::Credentials,
            ],
            VendorType::Lieu => [
                OnboardingStep::Professions,
                OnboardingStep::VenueCharacteristics,
                OnboardingStep::ZonesPricing,
                OnboardingStep::Portfolio,
                OnboardingStep::LegalInfo,
                OnboardingStep::Credentials,
            ],
            VendorType::Createurs => [
                OnboardingStep::Professions,
                OnboardingStep::Consent,
                OnboardingStep::Experiences,
                OnboardingStep::ZonesPricing,
                OnboardingStep::Portfolio,
                OnboardingStep::LegalInfo,
                OnboardingStep::Credentials,
            ],
        };
    }

    public function resolveNextStep(VendorType $vendorType, OnboardingStep $current): ?OnboardingStep
    {
        $steps = $this->getOnboardingSteps($vendorType);
        $indexStep   = array_search($current, $steps, true);

        return $steps[$indexStep + 1] ?? null;
    }

    /**
     * @param array<string, bool> $filledSteps
     * @return array<OnboardingStepResponse>
     */
    public function resolveAllSteps(
        VendorType $vendorType,
        OnboardingStep $currentStep,
        array $filledSteps,
    ): array {
        $steps        = $this->getOnboardingSteps($vendorType);
        $currentIndex = array_search($currentStep, $steps, true);

        $result = [];
        foreach ($steps as $index => $step) {
            $status = match (true) {
                $index < $currentIndex   => 'completed',
                $index === $currentIndex => 'current',
                default                  => 'pending',
            };

            $result[] = new OnboardingStepResponse(
                stepKey:     $step->value,
                label:       $step->label($vendorType),
                order:       $index + 1,
                status:      $status,
                isFilled: $filledSteps[$step->value] ?? false,
            );
        }

        return $result;
    }
}
