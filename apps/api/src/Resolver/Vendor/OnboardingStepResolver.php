<?php

declare(strict_types=1);

namespace App\Resolver\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;

readonly class OnboardingStepResolver
{
    /** @return array<OnboardingStep> */
    public function getOnboardingSteps(VendorType $vendorType): array
    {
        return match ($vendorType) {
            VendorType::Freelance => [
                OnboardingStep::Professions,
                OnboardingStep::Experiences,
                OnboardingStep::ZonesPricing,
                OnboardingStep::Portfolio,
                OnboardingStep::LegalInfo,
                OnboardingStep::Credentials,
            ],
            VendorType::Traiteur => [
                OnboardingStep::Professions,
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
        };
    }

    public function resolveNextStep(VendorType $vendorType, OnboardingStep $current): ?OnboardingStep
    {
        $steps = $this->getOnboardingSteps($vendorType);
        $indexStep   = array_search($current, $steps, true);

        return $steps[$indexStep + 1] ?? null;
    }
}
