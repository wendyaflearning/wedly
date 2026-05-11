<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum OnboardingStep: string
{
    case Professions             = 'professions';
    case Experiences             = 'experiences';
    case VenueCharacteristics    = 'venue_characteristics';
    case CateringCharacteristics = 'catering_characteristics';
    case ZonesPricing            = 'zones_pricing';
    case Portfolio               = 'portfolio';
    case LegalInfo               = 'legal_info';
    case Credentials             = 'credentials';

    public function label(VendorType $vendorType): string
    {
        return match ($this) {
            self::Professions             => 'Vos services',
            self::Experiences             => 'Votre expérience',
            self::VenueCharacteristics    => 'Caractéristiques du lieu',
            self::CateringCharacteristics => 'Caractéristiques traiteur',
            self::ZonesPricing            => 'Zones et tarifs',
            self::Portfolio               => 'Portfolio',
            self::LegalInfo               => 'Informations légales',
            self::Credentials             => 'Accès à votre espace',
        };
    }
}
