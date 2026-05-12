<?php

declare(strict_types=1);

namespace App\DTO\Onboarding;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;

final readonly class VendorInviteTokenDataDto
{
    public array $data;

    public function __construct(Vendor $vendor)
    {
        $this->data = [
            'id'               => $vendor->getId()->toRfc4122(),
            'brand_name'       => $vendor->getBrandName(),
            'price_min_cents'  => $vendor->getPriceMinCents(),
            'price_max_cents'  => $vendor->getPriceMaxCents(),
            'price_type'       => $vendor->getPriceType()->value,
            'status'           => $vendor->getStatus()->value,
            'firstname'        => $vendor->getUser()->getFirstName(),
            'email'            => $vendor->getUser()->getEmail(),
            'phone'            => $vendor->getPhone(),
            'description'      => $vendor->getDescription(),
            'siret'            => $vendor->getSiret(),
            'address'          => $vendor->getAddress(),
            'zipcode'          => $vendor->getZipcode(),
            'city'             => $vendor->getCity(),
            'services'         => array_map(
                fn(Service $s) => ['id' => $s->getId()->toRfc4122(), 'name' => $s->getName()],
                $vendor->getServices()->toArray()
            ),
            'regions'          => array_map(
                fn(Region $r) => ['id' => $r->getId()->toRfc4122(), 'name' => $r->getName()],
                $vendor->getRegions()->toArray()
            ),
            'styles'           => array_map(
                fn(WeddingStyle $s) => ['id' => $s->getId()->toRfc4122(), 'name' => $s->getName()],
                $vendor->getStyles()->toArray()
            ),
            'cultures'         => array_map(
                fn(Culture $c) => ['id' => $c->getId()->toRfc4122(), 'name' => $c->getName()],
                $vendor->getCultures()->toArray()
            ),
            'confessions'      => array_map(
                fn(Confession $c) => ['id' => $c->getId()->toRfc4122(), 'name' => $c->getName()],
                $vendor->getConfessions()->toArray()
            ),
            'portfolio_images' => array_map(
                fn(PortfolioImage $img) => [
                    'id'       => $img->getId()->toRfc4122(),
                    'url'      => $img->getUrl(),
                    'sort_order' => $img->getSortOrder(),
                    'is_cover' => $img->isCover(),
                ],
                $vendor->getPortfolioImages()->toArray()
            ),
        ];
    }
}
