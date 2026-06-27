<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding;

use App\DTO\DTOInterface;
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

        #[Assert\Regex(
            pattern: '/^(\+33|0)[1-9]\d{8}$/',
            message: 'Le numéro de téléphone est invalide (ex : 0612345678 ou +33612345678).',
        )]
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
