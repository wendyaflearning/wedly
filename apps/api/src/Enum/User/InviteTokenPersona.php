<?php

declare(strict_types=1);

namespace App\Enum\User;

enum InviteTokenPersona: string
{
    case Vendor = 'vendor';
    case Couple = 'couple';
}
