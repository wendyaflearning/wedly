<?php

declare(strict_types=1);

namespace App\Event;

final readonly class StepperSubmittedEvent
{
    public function __construct(
        public string $firstName,
        public string $email,
    ) {}
}
