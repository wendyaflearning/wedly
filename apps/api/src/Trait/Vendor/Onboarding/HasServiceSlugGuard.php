<?php

declare(strict_types=1);

namespace App\Trait\Vendor\Onboarding;

use App\Entity\Vendor\Vendor;

trait HasServiceSlugGuard
{
    private function assertHasServiceSlug(Vendor $vendor, string $slug, string $message): void
    {
        if (!in_array($slug, $vendor->resolveVendorServices(), true)) {
            throw new \DomainException($message, 422);
        }
    }
}
