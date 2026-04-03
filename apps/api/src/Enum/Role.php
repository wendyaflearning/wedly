<?php

declare(strict_types=1);

namespace App\Enum;

enum Role: string
{
    case Couple = 'ROLE_COUPLE';
    case Vendor = 'ROLE_VENDOR';
    case Admin  = 'ROLE_ADMIN';
}
