<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\VenueCharacteristicsDto;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Trait\Vendor\Onboarding\HasServiceSlugGuard;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class VenueCharacteristicsStepService extends AbstractOnboardingStepHandler
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
        return OnboardingStep::VenueCharacteristics;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        $this->assertHasServiceSlug($vendor, 'lieu-de-reception', 'Cette étape est réservée aux lieux de réception.');

        /** @var VenueCharacteristicsDto $dto */
        $dto = $this->validate(VenueCharacteristicsDto::fromArray($data));

        $details = $vendor->getVenueDetails();
        $isNew   = $details === null;

        if ($isNew) {
            if ($dto->venueType === null) {
                throw new \DomainException('Le champ venue_type est requis à la création.', 422);
            }
            $details = new VendorVenueDetails();
            $details->setVendor($vendor);
        }

        if ($dto->venueType !== null) {
            $details->setVenueType($dto->venueType);
        }
        if ($dto->capacityMin !== null) {
            $details->setCapacityMin($dto->capacityMin);
        }
        if ($dto->capacityMax !== null) {
            $details->setCapacityMax($dto->capacityMax);
        }
        if ($dto->hasCatering !== null) {
            $details->setHasCatering($dto->hasCatering);
        }
        if ($dto->hasAccommodation !== null) {
            $details->setHasAccommodation($dto->hasAccommodation);
        }
        if ($dto->hasOutdoorSpace !== null) {
            $details->setHasOutdoorSpace($dto->hasOutdoorSpace);
        }
        if ($dto->hasCorkageFee !== null) {
            $details->setHasCorkageFee($dto->hasCorkageFee);
        }
        if ($dto->hasToilets !== null) {
            $details->setHasToilets($dto->hasToilets);
        }
        if ($dto->isPmrAccessible !== null) {
            $details->setIsPmrAccessible($dto->isPmrAccessible);
        }
        if ($dto->distanceToCityMinutes !== null) {
            $details->setDistanceToCityMinutes($dto->distanceToCityMinutes);
        }
        if ($dto->nearestCity !== null) {
            $details->setNearestCity($dto->nearestCity);
        }

        if ($isNew) {
            $this->em->persist($details);
        }
    }
}
