<?php

declare(strict_types=1);

namespace App\Enum\Subscription;

enum SubscriptionStatus: string
{
    case Active    = 'active';
    case Cancelled = 'cancelled';
}
