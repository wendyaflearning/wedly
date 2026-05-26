<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum CreatorSpecialty: string
{
    case WeddingDress  = 'wedding_dress';
    case CustomCostume = 'custom_costume';
    case Millinery     = 'millinery';
    case Jewelry       = 'jewelry';
    case Stationery    = 'stationery';
}
