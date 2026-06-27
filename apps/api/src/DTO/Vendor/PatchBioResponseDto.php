<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class PatchBioResponseDto
{
    public function __construct(
        public string $bio,
    ) {}
}
