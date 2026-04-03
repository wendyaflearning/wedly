<?php

declare(strict_types=1);

namespace App\Enum;

enum CeremonyType: string
{
    case Civil     = 'civil';
    case Laique    = 'laique';
    case Religieux = 'religieux';
    case Mixte     = 'mixte';
}
