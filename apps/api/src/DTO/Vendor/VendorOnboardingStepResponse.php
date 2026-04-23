<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Enum\Vendor\OnboardingStep;

final readonly class VendorOnboardingStepResponse
{
    public ?string $current_step;
    public array $completed_steps;

    public function __construct(?OnboardingStep $next, array $completed)
    {
        $this->current_step    = $next?->value;
        $this->completed_steps = array_map(fn(OnboardingStep $s) => $s->value, $completed);
    }
}
