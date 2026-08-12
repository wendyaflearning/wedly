<?php

declare(strict_types=1);

namespace App\Enum\Couple;

enum PlanningStage: string
{
    case JustStarted  = 'just_started';
    case InProgress   = 'in_progress';
    case AlmostReady  = 'almost_ready';
}
