<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\DTOInterface;
use App\DTO\Vendor\Step\CateringCharacteristicsDto;
use App\DTO\Vendor\Step\ExperiencesDto;
use App\DTO\Vendor\Step\ProfessionsDto;
use App\DTO\Vendor\Step\VenueCharacteristicsDto;
use App\DTO\Vendor\VendorOnboardingStepRequest;
use App\DTO\Vendor\VendorOnboardingStepResponse;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class VendorOnboardingStepService
{
    public function __construct(
        private EntityManagerInterface          $em,
        private ProfessionsStepService          $professionsStepService,
        private ExperiencesStepService          $experiencesStepService,
        private VenueCharacteristicsStepService    $venueCharacteristicsStepService,
        private CateringCharacteristicsStepService $cateringCharacteristicsStepService,
        private ValidatorInterface                 $validator,
    ) {}

    public function handle(Vendor $vendor, VendorOnboardingStepRequest $dto): VendorOnboardingStepResponse
    {
        $step = OnboardingStep::tryFrom($dto->step);
        if ($step === null) {
            throw new \DomainException(sprintf('Étape inconnue : %s', $dto->step), 422);
        }

        $data = $dto->data ?? [];

        match ($step) {
            OnboardingStep::Professions => $this->professionsStepService->handle(
                $vendor,
                $this->validate(ProfessionsDto::fromArray($data))
            ),
            OnboardingStep::Experiences => $this->experiencesStepService->handle(
                $vendor,
                ExperiencesDto::fromArray($data)
            ),
            OnboardingStep::VenueCharacteristics => $this->venueCharacteristicsStepService->handle(
                $vendor,
                $this->validate(VenueCharacteristicsDto::fromArray($data))
            ),
            OnboardingStep::CateringCharacteristics => $this->cateringCharacteristicsStepService->handle(
                $vendor,
                $this->validate(CateringCharacteristicsDto::fromArray($data))
            ),
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

    private function validate(DTOInterface $dto): DTOInterface
    {
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            throw new \DomainException($errors->get(0)->getMessage(), 422);
        }
        return $dto;
    }

    /**
     * Parcours stepper par type de prestataire :
     *
     * Lieu          : Professions → VenueCharacteristics → ZonesPricing → ...
     * Traiteur      : Professions → Experiences → CateringCharacteristics → ZonesPricing → ...
     * Indépendant   : Professions → Experiences → ZonesPricing → ...
     */
    private function resolveNextStep(Vendor $vendor, OnboardingStep $step): ?OnboardingStep
    {
        $slugs = array_map(
            fn ($service) => $service->getSlug(),
            $vendor->getServices()->toArray(),
        );

        if ($step === OnboardingStep::Professions) {

            if (in_array('lieu-de-reception', $slugs, true)) {
                return OnboardingStep::VenueCharacteristics;
            }

            return OnboardingStep::Experiences;
        }

        if ($step === OnboardingStep::Experiences) {

            if (in_array('traiteur', $slugs, true)) {
                return OnboardingStep::CateringCharacteristics;
            }
        }

        if ($step === OnboardingStep::VenueCharacteristics || $step === OnboardingStep::CateringCharacteristics) {
            return OnboardingStep::ZonesPricing;
        }

        $steps = OnboardingStep::cases();
        $idx   = array_search($step, $steps, true);

        return $steps[$idx + 1] ?? null;
    }
}
