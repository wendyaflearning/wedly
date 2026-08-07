<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\Portfolio;

use App\DTO\Service\TagValueResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;

trait PortfolioMappingTrait
{
    private function portfolio(Vendor $vendor): array
    {
        $images = $vendor->getPortfolioImages()->toArray();
        usort($images, fn(PortfolioImage $a, PortfolioImage $b) => $a->getSortOrder() <=> $b->getSortOrder());

        return array_map(
            fn(PortfolioImage $image) => [
                'id'      => $image->getId()->toRfc4122(),
                'url'     => $image->getUrl(),
                'isCover' => $image->isCover(),
                'tags'    => array_map(
                    fn(TagValue $tag) => TagValueResponseDto::fromEntity($tag),
                    $image->getTags()->toArray(),
                ),
            ],
            $images
        );
    }
}
