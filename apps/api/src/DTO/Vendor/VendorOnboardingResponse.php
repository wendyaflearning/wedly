<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;

final readonly class VendorOnboardingResponse
{
    public string $id;
    public string $brand_name;
    public int $price_min_cents;
    public int $price_max_cents;
    public string $price_type;
    public string $status;
    public array $services;
    public array $regions;
    public string $firstname;
    public string $email;
    public ?string $phone;
    public ?string $description;
    public ?string $siret;
    public ?string $address;
    public ?string $zipcode;
    public ?string $city;
    public array $styles;
    public array $cultures;
    public array $confessions;
    public array $portfolio_images;

    public function __construct(Vendor $vendor)
    {
        $this->id              = $vendor->getId()->toRfc4122();
        $this->brand_name      = $vendor->getBrandName();
        $this->price_min_cents = $vendor->getPriceMinCents();
        $this->price_max_cents = $vendor->getPriceMaxCents();
        $this->price_type      = $vendor->getPriceType()->value;
        $this->status          = $vendor->getStatus()->value;

        $this->services = array_map(
            fn(Service $service) => ['id' => $service->getId()->toRfc4122(), 'name' => $service->getName()],
            $vendor->getServices()->toArray()
        );

        $this->regions = array_map(
            fn(Region $region) => ['id' => $region->getId()->toRfc4122(), 'name' => $region->getName()],
            $vendor->getRegions()->toArray()
        );

        $this->firstname = $vendor->getUser()->getFirstName();
        $this->email     = $vendor->getUser()->getEmail();
        $this->phone     = $vendor->getPhone();

        $this->description = $vendor->getDescription();
        $this->siret       = $vendor->getSiret();
        $this->address     = $vendor->getAddress();
        $this->zipcode     = $vendor->getZipcode();
        $this->city        = $vendor->getCity();

        $this->styles = array_map(
            fn(WeddingStyle $style) => ['id' => $style->getId()->toRfc4122(), 'name' => $style->getName()],
            $vendor->getStyles()->toArray()
        );

        $this->cultures = array_map(
            fn(Culture $culture) => ['id' => $culture->getId()->toRfc4122(), 'name' => $culture->getName()],
            $vendor->getCultures()->toArray()
        );

        $this->confessions = array_map(
            fn(Confession $confession) => ['id' => $confession->getId()->toRfc4122(), 'name' => $confession->getName()],
            $vendor->getConfessions()->toArray()
        );

        $this->portfolio_images = array_map(
            fn(PortfolioImage $portfolioImage) => [
                'id'       => $portfolioImage->getId()->toRfc4122(),
                'url'      => $portfolioImage->getUrl(),
                'sort_seq' => $portfolioImage->getSortSeq(),
                'is_cover' => $portfolioImage->isCover(),
            ],
            $vendor->getPortfolioImages()->toArray()
        );
    }
}
