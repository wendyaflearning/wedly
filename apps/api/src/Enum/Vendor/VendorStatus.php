<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VendorStatus: string
{
    case Pending     = 'pending';
    case UnderReview = 'under_review';
    case Active      = 'active';
}
