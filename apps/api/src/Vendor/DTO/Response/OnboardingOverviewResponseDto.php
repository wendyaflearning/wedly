<?php

declare(strict_types=1);

namespace App\Vendor\DTO\Response;

readonly class OnboardingOverviewResponseDto
{
    public function __construct(
        public string $firstname,
        public string $vendor_type,
        /** @var array<OnboardingStepResponse> */
        public array $steps,
        public array $steps_data = [],
    ) {}
}
