<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\Vendor\VendorOnboardingStepRequest;
use App\DTO\Vendor\VendorOnboardingStepResponse;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use Doctrine\ORM\EntityManagerInterface;

readonly class VendorOnboardingStepService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ProfessionsStepService $professionsStepService,
        private ExperiencesStepService $experiencesStepService,
        private VenueCharacteristicsStepService $venueCharacteristicsStepService,
    ) {}

    public function handle(Vendor $vendor, VendorOnboardingStepRequest $dto): VendorOnboardingStepResponse
    {
        $step = OnboardingStep::tryFrom($dto->step);
        if ($step === null) {
            throw new \DomainException(sprintf('Étape inconnue : %s', $dto->step), 422);
        }

        match ($step) {
            OnboardingStep::Professions             => $this->professionsStepService->handle($vendor, $dto->data),
            OnboardingStep::Experiences             => $this->experiencesStepService->handle($vendor, $dto->data),
            OnboardingStep::VenueCharacteristics    => $this->venueCharacteristicsStepService->handle($vendor, $dto->data),
            OnboardingStep::CateringCharacteristics => null, // TODO — US-S3004
            OnboardingStep::ZonesPricing            => null, // TODO
            OnboardingStep::Portfolio               => null, // TODO
            OnboardingStep::LegalInfo               => null, // TODO
            OnboardingStep::Credentials             => null, // TODO
        };

        $vendor->setOnboardingStep($step);
        $this->em->flush();

        return new VendorOnboardingStepResponse(
            next:      $this->resolveNextStep($vendor, $step),
            completed: array_slice(OnboardingStep::cases(), 0, array_search($step, OnboardingStep::cases(), true) + 1),
        );
    }

    private function resolveNextStep(Vendor $vendor, OnboardingStep $step): ?OnboardingStep
    {
        if ($step === OnboardingStep::Professions) {
            $slugs = array_map(
                fn ($service) => $service->getSlug(),
                $vendor->getServices()->toArray(),
            );

            if (in_array('lieu-de-reception', $slugs, true)) {
                return OnboardingStep::VenueCharacteristics;
            }

            if (in_array('traiteur', $slugs, true)) {
                return OnboardingStep::CateringCharacteristics;
            }

            return OnboardingStep::Experiences;
        }

        if ($step === OnboardingStep::VenueCharacteristics || $step === OnboardingStep::CateringCharacteristics) {
            return OnboardingStep::ZonesPricing;
        }

        $steps = OnboardingStep::cases();
        $idx   = array_search($step, $steps, true);

        return $steps[$idx + 1] ?? null;
    }
}
