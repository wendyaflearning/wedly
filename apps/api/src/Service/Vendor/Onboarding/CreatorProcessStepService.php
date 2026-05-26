<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\CreatorProcessDto;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class CreatorProcessStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::CreatorProcess;
    }

    public function supportsVendorType(VendorType $type): bool
    {
        return $type === VendorType::Createurs;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var CreatorProcessDto $dto */
        $dto = $this->validate(CreatorProcessDto::fromArray($data));

        $details = $vendor->getCreatorDetails();
        if ($details === null) {
            throw new \DomainException('Veuillez d\'abord compléter l\'étape "Votre univers".', 422);
        }

        $details->setMinLeadTimeMonths($dto->minLeadTimeMonths);
        $details->setAnnualCapacity($dto->annualCapacity);
        $details->setRdvCount($dto->rdvCount);
        $details->setFirstRdvDurationMinutes($dto->firstRdvDurationMinutes);
    }

    public function getStepData(Vendor $vendor): array
    {
        $details = $vendor->getCreatorDetails();
        if ($details === null) {
            return [];
        }

        return [
            'min_lead_time_months'       => $details->getMinLeadTimeMonths(),
            'annual_capacity'            => $details->getAnnualCapacity(),
            'rdv_count'                  => $details->getRdvCount(),
            'first_rdv_duration_minutes' => $details->getFirstRdvDurationMinutes(),
        ];
    }
}
