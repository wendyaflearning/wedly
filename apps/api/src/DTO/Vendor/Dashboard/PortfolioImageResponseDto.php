<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Dashboard;

use App\DTO\Service\TagValueResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;

final readonly class PortfolioImageResponseDto
{
    public string $id;
    public string $url;
    public bool   $is_cover;
    public int    $sort_order;
    public array  $tags;

    public function __construct(PortfolioImage $image)
    {
        $this->id         = $image->getId()->toRfc4122();
        $this->url        = $image->getUrl();
        $this->is_cover   = $image->isCover();
        $this->sort_order = $image->getSortOrder();
        $this->tags       = array_values(array_map(
            static fn(TagValue $tag) => TagValueResponseDto::fromEntity($tag),
            $image->getTags()->toArray(),
        ));
    }
}
