<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorMatchingConsentResponseDto
{
    public ?bool $granted;
    public array $confession_ids;
    public array $culture_ids;

    public function __construct(?bool $granted, array $confessionIds, array $cultureIds)
    {
        $this->granted       = $granted;
        $this->confession_ids = $confessionIds;
        $this->culture_ids   = $cultureIds;
    }
}
