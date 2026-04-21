<?php

declare(strict_types=1);

namespace App\Enum\Couple;

enum CoupleStatus: string
{
    case Pending = 'pending';
    case Active  = 'active';
}
