<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use App\Enum\Vendor\VenueType;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final readonly class VenueCharacteristicsDto implements DTOInterface
{
    public function __construct(
        public ?VenueType $venueType,
        public ?int       $capacityMin,
        public ?int       $capacityMax,
        public ?bool      $hasCatering,
        public ?bool      $hasAccommodation,
        public ?bool      $hasOutdoorSpace,
        public ?bool      $hasCorkageFee,
        public ?bool      $hasToilets,
        public ?bool      $isPmrAccessible,
        public ?int       $distanceToCityMinutes,
        public ?string    $nearestCity,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            venueType: array_key_exists('venue_type', $data)
                ? (VenueType::tryFrom($data['venue_type'])
                    ?? throw new \InvalidArgumentException(sprintf('Type de lieu invalide : %s', $data['venue_type'])))
                : null,
            capacityMin:           array_key_exists('capacity_min', $data)              ? $data['capacity_min']              : null,
            capacityMax:           array_key_exists('capacity_max', $data)              ? $data['capacity_max']              : null,
            hasCatering:           array_key_exists('has_catering', $data)              ? $data['has_catering']              : null,
            hasAccommodation:      array_key_exists('has_accommodation', $data)         ? $data['has_accommodation']         : null,
            hasOutdoorSpace:       array_key_exists('has_outdoor_space', $data)         ? $data['has_outdoor_space']         : null,
            hasCorkageFee:         array_key_exists('has_corkage_fee', $data)           ? $data['has_corkage_fee']           : null,
            hasToilets:            array_key_exists('has_toilets', $data)               ? $data['has_toilets']               : null,
            isPmrAccessible:       array_key_exists('is_pmr_accessible', $data)         ? $data['is_pmr_accessible']         : null,
            distanceToCityMinutes: array_key_exists('distance_to_city_minutes', $data)  ? $data['distance_to_city_minutes']  : null,
            nearestCity:           array_key_exists('nearest_city', $data)              ? $data['nearest_city']              : null,
        );
    }

    #[Assert\Callback]
    public function validateCapacityRange(ExecutionContextInterface $context): void
    {
        if ($this->capacityMin !== null && $this->capacityMax !== null && $this->capacityMin >= $this->capacityMax) {
            $context->buildViolation('capacity_min doit être inférieur à capacity_max.')
                ->atPath('capacity_min')
                ->addViolation();
        }
    }
}
