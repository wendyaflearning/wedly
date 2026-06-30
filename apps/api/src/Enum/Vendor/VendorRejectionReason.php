<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VendorRejectionReason: string
{
    case PortfolioQuality        = 'portfolio_quality';
    case LegalIncomplete         = 'legal_incomplete';
    case PricingZonesIncomplete  = 'pricing_zones_incomplete';
    case DescriptionInsufficient = 'description_insufficient';
    case Other                   = 'other';

    public function label(): string
    {
        return match ($this) {
            self::PortfolioQuality        => 'Portfolio insuffisant ou de mauvaise qualité',
            self::LegalIncomplete         => 'Informations légales incomplètes ou non conformes',
            self::PricingZonesIncomplete  => 'Zones ou tarifs mal renseignés',
            self::DescriptionInsufficient => 'Description du profil insuffisante',
            self::Other                   => 'Autre',
        };
    }
}
