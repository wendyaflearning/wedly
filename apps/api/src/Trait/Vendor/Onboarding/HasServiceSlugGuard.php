<?php

declare(strict_types=1);

namespace App\Trait\Vendor\Onboarding;

use App\Entity\Vendor\Vendor;

trait HasServiceSlugGuard
{
    private function assertHasServiceSlug(Vendor $vendor, string $slug, string $message): void
    {
        $slugs = array_map(fn ($service) => $service->getSlug(), $vendor->getServices()->toArray());
        if (!in_array($slug, $slugs, true)) {
            throw new \DomainException($message, 422);
        }
    }
}
