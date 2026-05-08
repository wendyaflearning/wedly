<?php

declare(strict_types=1);

namespace App\Vendor\Onboarding\Request;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class LegalInfoStepRequest implements DTOInterface
{
    public function __construct(
        #[Assert\NotBlank]
        public string $brandName,

        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^\d{14}$/')]
        public string $siret,

        public ?string $phone,
        public ?string $address,
        public ?string $zipcode,
        public ?string $city,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            brandName: $data['brand_name'] ?? '',
            siret:     $data['siret'] ?? '',
            phone:     $data['phone'] ?? null,
            address:   $data['address'] ?? null,
            zipcode:   $data['zipcode'] ?? null,
            city:      $data['city'] ?? null,
        );
    }
}
