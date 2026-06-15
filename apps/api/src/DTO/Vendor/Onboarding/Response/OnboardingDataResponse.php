<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding\Response;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorType;

readonly class OnboardingDataResponse
{
    public function __construct(
        public string $firstname,
        public ?string $onboarding_step,
        public ?string $vendor_category,
        public array $services,
        public array $confessions,
        public array $cultures,
        public array $zones,
        public int $price_min,
        public int $price_max,
        public string $price_type,
        public array $portfolio,
        public array $legal,
        public string $email,
        public ?OnboardingVenueDetailsResponse $venue_details,
        public ?OnboardingCateringDetailsResponse $catering_details,
    ) {}

    public static function fromVendor(Vendor $vendor): self
    {
        $slugs    = $vendor->resolveVendorServices();
        $category = $vendor->resolveVendorType();

        $cover  = null;
        $images = [];
        foreach ($vendor->getPortfolioImages() as $image) {
            if ($image->isCover()) {
                $cover = $image->getUrl();
            } else {
                $images[] = $image->getUrl();
            }
        }

        return new self(
            firstname:        $vendor->getUser()->getFirstName(),
            onboarding_step:  $vendor->getOnboardingStep()?->value,
            vendor_category:  $category?->value,
            services:         $slugs,
            confessions:      array_map(fn($confession) => $confession->getSlug(), $vendor->getConfessions()->toArray()),
            cultures:         array_map(fn($culture) => $culture->getSlug(), $vendor->getCultures()->toArray()),
            zones:            array_map(fn($region) => $region->getSlug(), $vendor->getRegions()->toArray()),
            price_min:        $vendor->getPriceMinCents(),
            price_max:        $vendor->getPriceMaxCents(),
            price_type:       $vendor->getPriceType()->value,
            portfolio:        ['cover' => $cover, 'images' => $images],
            legal:            [
                'brand_name'     => $vendor->getBrandName(),
                'phone'          => $vendor->getPhone(),
                'address'        => $vendor->getAddress(),
                'zipcode'        => $vendor->getZipcode(),
                'city'           => $vendor->getCity(),
                'siret'          => $vendor->getSiret(),
                'siret_verified' => $vendor->isSiretVerified(),
                'legal_name'     => $vendor->getLegalName(),
                'legal_form'     => $vendor->getLegalForm(),
                'legal_status'   => $vendor->getLegalStatus(),
            ],
            email:            $vendor->getUser()->getEmail(),
            venue_details:    $category === VendorType::Lieu
                                  ? OnboardingVenueDetailsResponse::fromEntity($vendor->getVenueDetails())
                                  : null,
            catering_details: $category === VendorType::Traiteur
                                  ? OnboardingCateringDetailsResponse::fromEntity($vendor->getCateringDetails())
                                  : null,
        );
    }
}
