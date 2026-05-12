<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Enum\Vendor\OnboardingStep;

final readonly class VendorOnboardingStepResponse
{
    public ?string $current_step;
    public array $completed_steps;
    public array $steps_data;

    public function __construct(?OnboardingStep $next, array $completed, array $stepsData = [])
    {
        $this->current_step    = $next?->value;
        $this->completed_steps = array_map(fn(OnboardingStep $step) => $step->value, $completed);
        $this->steps_data      = $stepsData;
    }
}
