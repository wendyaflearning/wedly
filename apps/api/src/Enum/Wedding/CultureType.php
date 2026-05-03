<?php

declare(strict_types=1);

namespace App\Enum\Wedding;

enum CultureType: string
{
    case Continent = 'continent';
    case Country   = 'country';
    case Autre     = 'autre';
}
