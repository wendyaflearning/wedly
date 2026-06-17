<?php

declare(strict_types=1);

namespace App\Enum\User;

enum PasswordResetTokenStatus: string
{
    case Pending = 'pending';
    case Used    = 'used';
}
