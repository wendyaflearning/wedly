<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\CateringCharacteristicsDto;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Trait\Vendor\Onboarding\HasServiceSlugGuard;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class CateringCharacteristicsStepService extends AbstractOnboardingStepHandler
{
    use HasServiceSlugGuard;

    public function __construct(
        private EntityManagerInterface $em,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::CateringCharacteristics;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        $this->assertHasServiceSlug($vendor, 'traiteur', 'Cette étape est réservée aux traiteurs.');

        /** @var CateringCharacteristicsDto $dto */
        $dto = $this->validate(CateringCharacteristicsDto::fromArray($data));

        $details = $vendor->getCateringDetails();
        $isNew   = $details === null;

        if ($isNew) {
            $details = new VendorCateringDetails();
            $details->setVendor($vendor);
        }

        if ($dto->coversMin !== null) {
            $details->setCoversMin($dto->coversMin);
        }
        if ($dto->coversMax !== null) {
            $details->setCoversMax($dto->coversMax);
        }
        if ($dto->isKosher !== null) {
            $details->setIsKosher($dto->isKosher);
        }
        if ($dto->isHalal !== null) {
            $details->setIsHalal($dto->isHalal);
        }
        if ($dto->isVegan !== null) {
            $details->setIsVegan($dto->isVegan);
        }
        if ($dto->isGlutenFree !== null) {
            $details->setIsGlutenFree($dto->isGlutenFree);
        }
        if ($dto->isOffersTableService !== null) {
            $details->setOffersTableService($dto->isOffersTableService);
        }
        if ($dto->isOffersBuffet !== null) {
            $details->setOffersBuffet($dto->isOffersBuffet);
        }
        if ($dto->isOffersCocktail !== null) {
            $details->setOffersCocktail($dto->isOffersCocktail);
        }
        if ($dto->isProvideTableware !== null) {
            $details->setProvidesTableware($dto->isProvideTableware);
        }
        if ($dto->isProvideFurniture !== null) {
            $details->setProvidesFurniture($dto->isProvideFurniture);
        }

        if ($isNew) {
            $this->em->persist($details);
        }
    }
}
