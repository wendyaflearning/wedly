<?php

declare(strict_types=1);

namespace App\Vendor\DTO\Response;

readonly class OnboardingStepResponse
{
    public function __construct(
        public string $stepKey,
        public string $label,
        public int $order,
        public string $status,
        public bool $isFilled,
    ) {}
}
