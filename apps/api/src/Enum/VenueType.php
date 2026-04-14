<?php

declare(strict_types=1);

namespace App\Enum;

enum VenueType: string
{
    case Chateau = 'chateau';
    case Domaine = 'domaine';
    case Loft    = 'loft';
    case Autre   = 'autre';
}
