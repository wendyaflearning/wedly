<?php

declare(strict_types=1);

namespace App\Enum\ProviderLead;

enum ProviderLeadStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Contacted = 'contacted';
    case Closed = 'closed';
    case Unavailable = 'unavailable';
}
