<?php

declare(strict_types=1);

namespace App\Vendor\DTO\Response;

use App\Entity\Vendor\VendorCateringDetails;

readonly class OnboardingCateringDetailsResponse
{
    public function __construct(
        public ?int $covers_min,
        public ?int $covers_max,
        public ?bool $is_kosher,
        public ?bool $is_halal,
        public ?bool $is_vegan,
        public ?bool $is_gluten_free,
        public ?bool $is_offers_table_service,
        public ?bool $is_offers_buffet,
        public ?bool $is_offers_cocktail,
        public ?bool $is_provide_tableware,
        public ?bool $is_provide_furniture,
    ) {}

    public static function fromEntity(?VendorCateringDetails $entity): self
    {
        return new self(
            covers_min:              $entity?->getCoversMin(),
            covers_max:              $entity?->getCoversMax(),
            is_kosher:               $entity?->isKosher(),
            is_halal:                $entity?->isHalal(),
            is_vegan:                $entity?->isVegan(),
            is_gluten_free:          $entity?->isGlutenFree(),
            is_offers_table_service: $entity?->isOffersTableService(),
            is_offers_buffet:        $entity?->isOffersBuffet(),
            is_offers_cocktail:      $entity?->isOffersCocktail(),
            is_provide_tableware:    $entity?->isProvidesTableware(),
            is_provide_furniture:    $entity?->isProvidesFurniture(),
        );
    }
}
