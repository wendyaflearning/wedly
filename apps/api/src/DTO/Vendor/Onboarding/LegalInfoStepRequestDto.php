<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding;

use App\DTO\DTOInterface;
use App\Validator\Constraints\FrenchPhoneNumber;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class LegalInfoStepRequestDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotBlank]
        public string $brandName,

        #[Assert\NotBlank]
        public string $firstName,

        #[Assert\NotBlank]
        public string $lastName,

        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^\d{14}$/')]
        public string $siret,

        #[FrenchPhoneNumber]
        public ?string $phone,
        public ?string $address,
        public ?string $zipcode,
        public ?string $city,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            brandName: $data['brand_name'] ?? '',
            firstName: $data['first_name'] ?? '',
            lastName:  $data['last_name']  ?? '',
            siret:     $data['siret']      ?? '',
            phone:     $data['phone']      ?? null,
            address:   $data['address']    ?? null,
            zipcode:   $data['zipcode']    ?? null,
            city:      $data['city']       ?? null,
        );
    }
}
