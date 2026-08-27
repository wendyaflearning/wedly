<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VendorEmailLogStatus: string
{
    case Success = 'success';
    case Failed  = 'failed';
}
