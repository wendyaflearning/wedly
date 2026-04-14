<?php

declare(strict_types=1);

namespace App\Enum;

enum PriceType: string
{
    case PerService = 'per_service';
    case PerPerson  = 'per_person';
    case PerHour    = 'per_hour';
}
