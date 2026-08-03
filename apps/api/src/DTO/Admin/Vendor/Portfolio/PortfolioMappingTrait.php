<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;

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
                // TODO WED-97: styles/specialties retirés avec portfolio_image_style/specialty ; remplacer par les tags (TagValue) dans WED-100
                'styles'      => [],
                'specialties' => [],
            ],
            $images
        );
    }
}
