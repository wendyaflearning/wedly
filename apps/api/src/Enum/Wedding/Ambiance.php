<?php

declare(strict_types=1);

namespace App\Enum\Wedding;

enum Ambiance: string
{
    case IntimeAuthentique  = 'intime_authentique';
    case FestifConvivial    = 'festif_convivial';
    case ElegantSoigne      = 'elegant_soigne';
    case NatureLiberte      = 'nature_liberte';
    case GrandioseMemorable = 'grandiose_memorable';
}
