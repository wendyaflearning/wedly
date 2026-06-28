<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VenueType: string
{
    case Chateau  = 'chateau';
    case Domaine  = 'domaine';
    case Salle    = 'salle';
    case Loft     = 'loft';
    case Grange   = 'grange';
    case PleinAir = 'plein_air';
    case Autre    = 'autre';
}
