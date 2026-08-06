<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Portfolio;

final readonly class PatchPortfolioTagsRequestDto
{
    /**
     * @param string[] $tagValueIds
     */
    public function __construct(
        public array $tagValueIds = [],
    ) {}
}
