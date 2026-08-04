<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\Portfolio;

final readonly class PatchVendorPortfolioTagsRequestDto
{
    /**
     * @param string[]|null $styleIds
     * @param string[]|null $specialtyIds
     */
    public function __construct(
        public ?array $styleIds = null,
        public ?array $specialtyIds = null,
    ) {}
}
