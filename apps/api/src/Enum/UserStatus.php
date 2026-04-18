<?php

declare(strict_types=1);

namespace App\Enum;

enum UserStatus: string
{
    case Pending     = 'pending';
    case UnderReview = 'under_review';
    case Active      = 'active';
    case Suspended   = 'suspended';
}
