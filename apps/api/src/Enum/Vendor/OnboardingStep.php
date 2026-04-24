<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum OnboardingStep: string
{
    case Professions  = 'professions';
    case Experiences             = 'experiences';
    case VenueCharacteristics    = 'venue_characteristics';
    case CateringCharacteristics = 'catering_characteristics';
    case ZonesPricing            = 'zones_pricing';
    case Portfolio    = 'portfolio';
    case LegalInfo    = 'legal_info';
    case Credentials  = 'credentials';
}
