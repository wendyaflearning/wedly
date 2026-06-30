<?php

declare(strict_types=1);

namespace App\Event;

final readonly class VendorRejectedEvent
{
    public function __construct(
        public string $firstName,
        public string $email,
        public array $reasons,
        public ?string $note,
    ) {}
}
