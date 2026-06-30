<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

final readonly class AdminVendorDraftRequestDto
{
    public function __construct(
        public ?string $firstname,
        public ?string $lastName,
        public ?string $email,
        public ?string $brandName,
        public ?string $serviceId,
        public ?array $regions,
        public ?int $priceMin,
        public ?int $priceMax,
        public ?string $priceType,
        public ?array $experiences,
        public ?array $legalInfo,
        public ?array $venueCharacteristics,
        public ?array $cateringCharacteristics,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            firstname:               self::stringOrNull($data['firstname'] ?? null),
            lastName:                self::stringOrNull($data['last_name'] ?? null),
            email:                   self::stringOrNull($data['email'] ?? null),
            brandName:               self::stringOrNull($data['brand_name'] ?? null),
            serviceId:               self::stringOrNull($data['service_id'] ?? null),
            regions:                 array_key_exists('regions', $data) ? $data['regions'] : null,
            priceMin:                array_key_exists('price_min', $data) ? self::intOrNull($data['price_min']) : null,
            priceMax:                array_key_exists('price_max', $data) ? self::intOrNull($data['price_max']) : null,
            priceType:               self::stringOrNull($data['price_type'] ?? null),
            experiences:             array_key_exists('experiences', $data) ? $data['experiences'] : null,
            legalInfo:               array_key_exists('legal_info', $data) ? $data['legal_info'] : null,
            venueCharacteristics:    array_key_exists('venue_characteristics', $data) ? $data['venue_characteristics'] : null,
            cateringCharacteristics: array_key_exists('catering_characteristics', $data) ? $data['catering_characteristics'] : null,
        );
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    private static function intOrNull(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }
}
