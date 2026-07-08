<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Vendor\Vendor;

final readonly class VendorSubmittedForReviewEvent
{
    public function __construct(public Vendor $vendor) {}
}
