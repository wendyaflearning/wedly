<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum Zone: string
{
    case Idf    = 'idf';
    case Nord   = 'nord';
    case Sud    = 'sud';
    case Ouest  = 'ouest';
    case Est    = 'est';
    case DomTom = 'dom_tom';
}
