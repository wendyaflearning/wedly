<?php

declare(strict_types=1);

namespace App\Handler\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\ConsentStepRequestDto;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorConsent;
use App\Enum\Vendor\ConsentType;
use App\Enum\Vendor\OnboardingStep;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

// granted: false → ExperiencesStepHandler et CateringCharacteristicsStepHandler::isFilled() retournent true (skip implicite)
readonly class ConsentStepHandler extends AbstractOnboardingStepHandler
{
    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::Consent;
    }

    public function record(Vendor $vendor, array $data): VendorConsent
    {
        /** @var ConsentStepRequestDto $dto */
        $dto = $this->validate(ConsentStepRequestDto::fromArray($data));

        $consent = new VendorConsent($vendor, ConsentType::SensitiveData, $dto->granted);
        $this->em->persist($consent);

        return $consent;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var ConsentStepRequestDto $dto */
        $dto = $this->validate(ConsentStepRequestDto::fromArray($data));

        $consent = $this->em->getRepository(VendorConsent::class)->findOneBy(
            ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
            ['createdAt' => 'DESC'],
        );

        if ($consent !== null) {
            $consent->setGranted($dto->granted);
        } else {
            $consent = new VendorConsent($vendor, ConsentType::SensitiveData, $dto->granted);
            $this->em->persist($consent);
        }
    }

    public function isFilled(Vendor $vendor): bool
    {
        return null !== $this->em->getRepository(VendorConsent::class)->findOneBy(
            ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
            ['createdAt' => 'DESC'],
        );
    }

    public function getStepData(Vendor $vendor): array
    {
        $consent = $this->em->getRepository(VendorConsent::class)->findOneBy(
            ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
            ['createdAt' => 'DESC'],
        );

        if ($consent === null) {
            return [];
        }

        return ['granted' => $consent->isGranted()];
    }
}
