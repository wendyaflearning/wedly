<?php

declare(strict_types=1);

namespace App\Event;

final readonly class VendorValidatedEvent
{
    public function __construct(
        public string $firstName,
        public string $email,
        public string $dashboardUrl,
    ) {}
}
