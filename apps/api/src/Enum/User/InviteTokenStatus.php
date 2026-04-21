<?php

declare(strict_types=1);

namespace App\Enum\User;

enum InviteTokenStatus: string
{
    case Pending = 'pending';
    case Used    = 'used';
    case Expired = 'expired';
}
