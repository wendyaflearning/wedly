<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding\Response;

use App\Entity\Vendor\VendorVenueDetails;

readonly class OnboardingVenueDetailsResponse
{
    public function __construct(
        public ?string $venue_type,
        public ?int $capacity_min,
        public ?int $capacity_max,
        public ?bool $has_catering,
        public ?bool $has_accommodation,
        public ?bool $has_outdoor_space,
        public ?bool $has_corkage_fee,
        public ?bool $has_toilets,
        public ?bool $is_pmr_accessible,
        public ?int $distance_to_city_minutes,
        public ?string $nearest_city,
    ) {}

    public static function fromEntity(?VendorVenueDetails $entity): self
    {
        return new self(
            venue_type:               $entity?->getVenueType()?->value,
            capacity_min:             $entity?->getCapacityMin(),
            capacity_max:             $entity?->getCapacityMax(),
            has_catering:             $entity?->isHasCatering(),
            has_accommodation:        $entity?->isHasAccommodation(),
            has_outdoor_space:        $entity?->isHasOutdoorSpace(),
            has_corkage_fee:          $entity?->isHasCorkageFee(),
            has_toilets:              $entity?->isHasToilets(),
            is_pmr_accessible:        $entity?->isIsPmrAccessible(),
            distance_to_city_minutes: $entity?->getDistanceToCityMinutes(),
            nearest_city:             $entity?->getNearestCity(),
        );
    }
}
