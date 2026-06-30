<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Vendor\Vendor;

final readonly class AdminVendorDraftListResponseDto
{
    public array $items;
    public int $total;

    /** @param Vendor[] $vendors */
    public function __construct(array $vendors)
    {
        $this->items = array_map(fn(Vendor $vendor) => new AdminVendorListItemResponseDto($vendor), $vendors);
        $this->total = count($vendors);
    }
}
