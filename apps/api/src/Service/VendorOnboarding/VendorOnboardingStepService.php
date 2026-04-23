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
    ) {}

    public function handle(Vendor $vendor, VendorOnboardingStepRequest $dto): VendorOnboardingStepResponse
    {
        $step = OnboardingStep::tryFrom($dto->step);
        if ($step === null) {
            throw new \DomainException(sprintf('Étape inconnue : %s', $dto->step), 422);
        }

        match ($step) {
            OnboardingStep::Professions  => $this->professionsStepService->handle($vendor, $dto->data),
            OnboardingStep::Experiences  => $this->experiencesStepService->handle($vendor, $dto->data),
            OnboardingStep::ZonesPricing => null, // TODO
            OnboardingStep::Portfolio    => null, // TODO
            OnboardingStep::LegalInfo    => null, // TODO
            OnboardingStep::Credentials  => null, // TODO
        };

        $vendor->setOnboardingStep($step);
        $this->em->flush();

        $steps = OnboardingStep::cases();
        $idx   = array_search($step, $steps, true);

        return new VendorOnboardingStepResponse(
            next:      $steps[$idx + 1] ?? null,
            completed: array_slice($steps, 0, $idx + 1),
        );
    }
}
