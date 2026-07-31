<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;

trait PortfolioMappingTrait
{
    private function portfolio(Vendor $vendor): array
    {
        $images = $vendor->getPortfolioImages()->toArray();
        usort($images, fn(PortfolioImage $a, PortfolioImage $b) => $a->getSortOrder() <=> $b->getSortOrder());

        return array_map(
            fn(PortfolioImage $image) => [
                'id'          => $image->getId()->toRfc4122(),
                'url'         => $image->getUrl(),
                'isCover'     => $image->isCover(),
                'styles'      => $this->tags($image->getStyles()->toArray()),
                'specialties' => $this->tags($image->getSpecialties()->toArray()),
            ],
            $images
        );
    }

    private function tags(array $tags): array
    {
        return array_map(
            fn(WeddingStyle|Specialty $tag) => [
                'id'   => $tag->getId()->toRfc4122(),
                'name' => $tag->getName(),
                'slug' => $tag->getSlug(),
            ],
            $tags
        );
    }
}
