<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorWeddreamLaunchOutcome;

final readonly class VendorWeddreamLaunchResult
{
    public function __construct(
        public Vendor $vendor,
        public VendorWeddreamLaunchOutcome $outcome,
        public ?string $errorMessage = null,
        public ?string $ctaLabel = null,
        public ?string $ctaUrl = null,
    ) {}
}
