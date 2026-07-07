<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Preview;

final readonly class VendorMePreviewResponseDto
{
    public string  $id;
    public string  $brand_name;
    public ?string $bio;
    public ?string $description;
    public string  $vendor_type;
    public array   $services;
    public array   $styles;
    public array   $portfolio_images;
    public array   $booking_blockers;
    public array   $zones;
    public int     $price_min_cents;
    public int     $price_max_cents;
    public string  $price_type;
    public array   $completion;

    public function __construct(
        string  $id,
        string  $brandName,
        ?string $bio,
        ?string $description,
        string  $vendorType,
        array   $services,
        array   $styles,
        array   $portfolioImages,
        array   $bookingBlockers,
        array   $zones,
        int     $priceMinCents,
        int     $priceMaxCents,
        string  $priceType,
        array   $completion,
    ) {
        $this->id               = $id;
        $this->brand_name       = $brandName;
        $this->bio              = $bio;
        $this->description      = $description;
        $this->vendor_type      = $vendorType;
        $this->services         = $services;
        $this->styles           = $styles;
        $this->portfolio_images = $portfolioImages;
        $this->booking_blockers = $bookingBlockers;
        $this->zones            = $zones;
        $this->price_min_cents  = $priceMinCents;
        $this->price_max_cents  = $priceMaxCents;
        $this->price_type       = $priceType;
        $this->completion       = $completion;
    }
}
