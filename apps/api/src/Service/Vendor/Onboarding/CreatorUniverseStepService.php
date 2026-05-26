<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\CreatorUniverseDto;
use App\Entity\Creator\CreatorValue;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCreatorDetails;
use App\Enum\Vendor\CreatorSpecialty;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class CreatorUniverseStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::CreatorUniverse;
    }

    public function supportsVendorType(VendorType $type): bool
    {
        return $type === VendorType::Createurs;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var CreatorUniverseDto $dto */
        $dto = $this->validate(CreatorUniverseDto::fromArray($data));

        $details = $vendor->getCreatorDetails();
        $isNew   = $details === null;

        if ($isNew) {
            $details = new VendorCreatorDetails();
            $details->setVendor($vendor);
        }

        $details->setCreatorSpecialty(CreatorSpecialty::from($dto->creatorSpecialty));
        $details->setHasFixedWorkshop($dto->hasFixedWorkshop);

        $values = [];
        foreach ($dto->creatorValueIds as $id) {
            $value = $this->em->getRepository(CreatorValue::class)->find($id);
            if ($value === null) {
                throw new \DomainException(sprintf('Valeur créateur introuvable : %s', $id), 422);
            }
            $values[] = $value;
        }

        $details->getCreatorValues()->clear();
        foreach ($values as $value) {
            $details->addCreatorValue($value);
        }

        if ($isNew) {
            $this->em->persist($details);
        }
    }

    public function getStepData(Vendor $vendor): array
    {
        $details = $vendor->getCreatorDetails();
        if ($details === null) {
            return [];
        }

        return [
            'creator_specialty'  => $details->getCreatorSpecialty()->value,
            'has_fixed_workshop' => $details->isHasFixedWorkshop(),
            'creator_value_ids'  => $details->getCreatorValues()
                ->map(fn(CreatorValue $value) => ['id' => $value->getId()->toString(), 'name' => $value->getName()])
                ->toArray(),
        ];
    }
}
