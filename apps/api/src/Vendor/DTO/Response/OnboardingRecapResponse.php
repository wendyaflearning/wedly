<?php

declare(strict_types=1);

namespace App\Vendor\DTO\Response;

readonly class OnboardingRecapResponse
{
    public function __construct(
        public string $firstname,
        /** @var array<OnboardingStepResponse> */
        public array $steps,
    ) {}
}
