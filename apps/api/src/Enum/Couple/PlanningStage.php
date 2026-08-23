<?php

declare(strict_types=1);

namespace App\Enum\Couple;

enum PlanningStage: string
{
    case JustStarted  = 'just_started';
    case InProgress   = 'in_progress';
    case AlmostReady  = 'almost_ready';

    /** @return string[] */
    public static function values(): array
    {
        return array_map(static fn(self $stage): string => $stage->value, self::cases());
    }
}
