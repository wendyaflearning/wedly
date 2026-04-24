<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\Vendor\VenueType;
use Doctrine\ORM\EntityManagerInterface;

readonly class VenueCharacteristicsStepService
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {}

    public function handle(Vendor $vendor, array $data): void
    {
        $slugs = array_map(fn ($s) => $s->getSlug(), $vendor->getServices()->toArray());
        if (!in_array('lieu-de-reception', $slugs, true)) {
            throw new \DomainException('Cette étape est réservée aux lieux de réception.', 422);
        }

        $this->validate($data);

        $details = $vendor->getVenueDetails();
        $isNew   = $details === null;

        if ($isNew) {
            if (!array_key_exists('venue_type', $data)) {
                throw new \DomainException('Le champ venue_type est requis à la création.', 422);
            }
            $details = new VendorVenueDetails();
            $details->setVendor($vendor);
        }

        if (array_key_exists('venue_type', $data)) {
            $venueType = VenueType::tryFrom($data['venue_type']);
            if ($venueType === null) {
                throw new \DomainException(sprintf('Type de lieu invalide : %s', $data['venue_type']), 422);
            }
            $details->setVenueType($venueType);
        }

        if (array_key_exists('capacity_min', $data)) {
            $details->setCapacityMin($data['capacity_min']);
        }

        if (array_key_exists('capacity_max', $data)) {
            $details->setCapacityMax($data['capacity_max']);
        }

        if (array_key_exists('has_catering', $data)) {
            $details->setHasCatering($data['has_catering']);
        }

        if (array_key_exists('has_accommodation', $data)) {
            $details->setHasAccommodation($data['has_accommodation']);
        }

        if (array_key_exists('has_outdoor_space', $data)) {
            $details->setHasOutdoorSpace($data['has_outdoor_space']);
        }

        if (array_key_exists('has_corkage_fee', $data)) {
            $details->setHasCorkageFee($data['has_corkage_fee']);
        }

        if (array_key_exists('has_toilets', $data)) {
            $details->setHasToilets($data['has_toilets']);
        }

        if (array_key_exists('is_pmr_accessible', $data)) {
            $details->setIsPmrAccessible($data['is_pmr_accessible']);
        }

        if (array_key_exists('distance_to_city_minutes', $data)) {
            $details->setDistanceToCityMinutes($data['distance_to_city_minutes']);
        }

        if (array_key_exists('nearest_city', $data)) {
            $details->setNearestCity($data['nearest_city']);
        }

        if ($isNew) {
            $this->em->persist($details);
        }
    }

    private function validate(array $data): void
    {
        $min = $data['capacity_min'] ?? null;
        $max = $data['capacity_max'] ?? null;

        if ($min !== null && $max !== null && $min >= $max) {
            throw new \DomainException('capacity_min doit être inférieur à capacity_max.', 422);
        }
    }
}
