<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Vendor\Vendor;

final readonly class AdminVendorListResponseDto
{
    public array $items;
    public int $totalAll;
    public int $totalFiltered;

    /** @param Vendor[] $vendors */
    public function __construct(array $vendors, int $totalAll)
    {
        $this->items         = array_map(fn(Vendor $vendor) => new AdminVendorListItemResponseDto($vendor), $vendors);
        $this->totalAll      = $totalAll;
        $this->totalFiltered = count($vendors);
    }
}
