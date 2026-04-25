<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\Vendor\Step\VenueCharacteristicsDto;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use Doctrine\ORM\EntityManagerInterface;

readonly class VenueCharacteristicsStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, VenueCharacteristicsDto $venueDto): void
    {
        $slugs = array_map(fn ($s) => $s->getSlug(), $vendor->getServices()->toArray());
        if (!in_array('lieu-de-reception', $slugs, true)) {
            throw new \DomainException('Cette étape est réservée aux lieux de réception.', 422);
        }

        $this->validateCapacityRange($venueDto);

        $details = $vendor->getVenueDetails();
        $isNew   = $details === null;

        if ($isNew) {
            if ($venueDto->venueType === null) {
                throw new \DomainException('Le champ venue_type est requis à la création.', 422);
            }
            $details = new VendorVenueDetails();
            $details->setVendor($vendor);
        }

        if ($venueDto->venueType !== null) {
            $details->setVenueType($venueDto->venueType);
        }

        if ($venueDto->capacityMin !== null) {
            $details->setCapacityMin($venueDto->capacityMin);
        }

        if ($venueDto->capacityMax !== null) {
            $details->setCapacityMax($venueDto->capacityMax);
        }

        if ($venueDto->hasCatering !== null) {
            $details->setHasCatering($venueDto->hasCatering);
        }

        if ($venueDto->hasAccommodation !== null) {
            $details->setHasAccommodation($venueDto->hasAccommodation);
        }

        if ($venueDto->hasOutdoorSpace !== null) {
            $details->setHasOutdoorSpace($venueDto->hasOutdoorSpace);
        }

        if ($venueDto->hasCorkageFee !== null) {
            $details->setHasCorkageFee($venueDto->hasCorkageFee);
        }

        if ($venueDto->hasToilets !== null) {
            $details->setHasToilets($venueDto->hasToilets);
        }

        if ($venueDto->isPmrAccessible !== null) {
            $details->setIsPmrAccessible($venueDto->isPmrAccessible);
        }

        if ($venueDto->distanceToCityMinutes !== null) {
            $details->setDistanceToCityMinutes($venueDto->distanceToCityMinutes);
        }

        if ($venueDto->nearestCity !== null) {
            $details->setNearestCity($venueDto->nearestCity);
        }

        if ($isNew) {
            $this->em->persist($details);
        }
    }

    private function validateCapacityRange(VenueCharacteristicsDto $venueDto): void
    {
        $min = $venueDto->capacityMin;
        $max = $venueDto->capacityMax;

        if ($min !== null && $max !== null && $min >= $max) {
            throw new \DomainException('capacity_min doit être inférieur à capacity_max.', 422);
        }
    }
}
