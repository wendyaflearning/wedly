<?php

declare(strict_types=1);

namespace App\Enum;

enum CultureType: string
{
    case Continent = 'continent';
    case Country   = 'country';
}
