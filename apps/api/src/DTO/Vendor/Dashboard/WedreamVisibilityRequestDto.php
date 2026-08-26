<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Dashboard;

final readonly class WedreamVisibilityRequestDto
{
    public function __construct(
        public bool $enabled,
    ) {}
}
