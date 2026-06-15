<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final readonly class VenuePricingRequestDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotNull]
        #[Assert\Positive]
        public ?int $priceMin,

        #[Assert\NotNull]
        #[Assert\Positive]
        public ?int $priceMax,

        #[Assert\NotNull]
        #[Assert\Choice(['per_service', 'per_person', 'per_hour'])]
        public ?string $priceType,

        #[Assert\NotNull]
        #[Assert\Count(min: 1, max: 1)]
        public ?array $zones,

        #[Assert\NotNull]
        #[Assert\NotBlank]
        public ?string $city,

        #[Assert\NotNull]
        #[Assert\NotBlank]
        public ?string $nearestCity,

        #[Assert\NotNull]
        #[Assert\Positive]
        public ?int $distanceToCityMinutes,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            priceMin:              array_key_exists('price_min', $data)                ? $data['price_min']                : null,
            priceMax:              array_key_exists('price_max', $data)                ? $data['price_max']                : null,
            priceType:             array_key_exists('price_type', $data)               ? $data['price_type']               : null,
            zones:                 array_key_exists('zones', $data)                    ? $data['zones']                    : null,
            city:                  array_key_exists('city', $data)                     ? $data['city']                     : null,
            nearestCity:           array_key_exists('nearest_city', $data)             ? $data['nearest_city']             : null,
            distanceToCityMinutes: array_key_exists('distance_to_city_minutes', $data) ? $data['distance_to_city_minutes'] : null,
        );
    }

    #[Assert\Callback]
    public function validatePriceRange(ExecutionContextInterface $context): void
    {
        if ($this->priceMin !== null && $this->priceMax !== null && $this->priceMin >= $this->priceMax) {
            $context->buildViolation('price_min doit être inférieur à price_max.')
                ->atPath('price_min')
                ->addViolation();
        }
    }
}
