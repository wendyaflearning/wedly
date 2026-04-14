<?php

declare(strict_types=1);

namespace App\Enum;

enum InviteTokenStatus: string
{
    case Pending = 'pending';
    case Used    = 'used';
    case Expired = 'expired';
}
