<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorSettingsResponseDto
{
    public function __construct(
        public string $firstName,
        public ?string $lastName,
        public string $email,
    ) {}
}
