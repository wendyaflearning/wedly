<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Dashboard;

use App\Entity\Vendor\PortfolioImage;

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
        // TODO WED-97: styles/specialties retirés avec portfolio_image_style/specialty ; remplacer par les tags (TagValue) dans WED-100
        $this->tags       = [
            'styles'      => [],
            'specialties' => [],
        ];
    }
}
