<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VendorType
{
    case Freelance;
    case Lieu;
    case Traiteur;

    public static function resolveVendorType(array $slugs): self
    {
        if (in_array('lieu-de-reception', $slugs, true)) {
            return self::Lieu;
        }

        if (in_array('traiteur', $slugs, true)) {
            return self::Traiteur;
        }

        return self::Freelance;
    }
}
