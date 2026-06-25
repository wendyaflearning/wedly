<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

final readonly class RejectVendorRequestDto
{
    /** @param string[] $reasons */
    public function __construct(
        public array $reasons = [],
        public ?string $note = null,
    ) {}
}
