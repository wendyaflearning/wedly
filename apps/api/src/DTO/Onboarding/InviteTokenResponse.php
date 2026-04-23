<?php

declare(strict_types=1);

namespace App\DTO\Onboarding;

final readonly class InviteTokenResponse
{
    public function __construct(
        public string $type,
        public array $data,
    ) {}
}
