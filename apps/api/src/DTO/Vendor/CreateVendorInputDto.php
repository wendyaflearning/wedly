<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Enum\Vendor\PriceType;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateVendorInputDto
{
    public function __construct(
        #[Assert\NotBlank]
        public string $firstname,

        #[Assert\NotBlank]
        #[Assert\Email]
        public string $email,

        #[Assert\NotBlank]
        public string $brand_name,

        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $service_id,

        #[Assert\NotBlank]
        #[Assert\Count(min: 1)]
        #[Assert\All([new Assert\Uuid()])]
        public array $regions,

        #[Assert\NotBlank]
        #[Assert\PositiveOrZero]
        public int $price_min,

        #[Assert\NotBlank]
        #[Assert\PositiveOrZero]
        public int $price_max,

        public PriceType $price_type,
    ) {}
}
