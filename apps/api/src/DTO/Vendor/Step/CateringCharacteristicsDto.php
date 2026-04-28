<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;


final readonly class CateringCharacteristicsDto implements DTOInterface
{
    public function __construct(
        public ?int       $coversMin,
        public ?int       $coversMax,
        public ?bool      $isKosher,
        public ?bool      $isHalal,
        public ?bool      $isVegan,
        public ?bool      $isGlutenFree,
        public ?bool      $isOffersTableService,
        public ?bool      $isOffersBuffet,
        public ?bool      $isOffersCocktail,
        public ?bool      $isProvideTableware,
        public ?bool      $isProvideFurniture,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            coversMin: array_key_exists('covers_min', $data)                ? $data['covers_min']              : null,
            coversMax: array_key_exists('covers_max', $data)                ? $data['covers_max']              : null,
            isKosher: array_key_exists('is_kosher', $data)                 ? $data['is_kosher']              : null,
            isHalal: array_key_exists('is_halal', $data)                  ? $data['is_halal']         : null,
            isVegan: array_key_exists('is_vegan', $data)                  ? $data['is_vegan']         : null,
            isGlutenFree: array_key_exists('is_gluten_free', $data)             ? $data['is_gluten_free']           : null,
            isOffersTableService: array_key_exists('is_offers_table_service', $data)     ? $data['is_offers_table_service']               : null,
            isOffersBuffet: array_key_exists('is_offers_buffet', $data)           ? $data['is_offers_buffet']         : null,
            isOffersCocktail: array_key_exists('is_offers_cocktail', $data)         ? $data['is_offers_cocktail']  : null,
            isProvideTableware: array_key_exists('is_provide_tableware', $data)       ? $data['is_provide_tableware']              : null,
            isProvideFurniture: array_key_exists('is_provide_furniture', $data)       ? $data['is_provide_furniture']              : null,
        );
    }

    #[Assert\Callback]
    public function validateCovers(ExecutionContextInterface $context): void
    {
        if($this->coversMin !== null && $this->coversMax !== null) {
            if($this->coversMin > $this->coversMax) {
                $context->buildViolation('covers_min doit être inférieur à covers_max')
                    ->atPath('covers_min')
                    ->addViolation();
            }
        }
    }
}
