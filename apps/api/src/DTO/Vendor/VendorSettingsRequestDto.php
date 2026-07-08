<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VendorSettingsRequestDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'Le prénom ne peut pas être vide.')]
        #[Assert\Length(max: 100, maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.')]
        public string $firstName,

        #[Assert\Length(max: 100, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
        public ?string $lastName,

        #[Assert\NotBlank(message: "L'adresse e-mail ne peut pas être vide.")]
        #[Assert\Email(message: "L'adresse e-mail '{{ value }}' n'est pas valide.")]
        #[Assert\Length(max: 180, maxMessage: "L'adresse e-mail ne peut pas dépasser {{ limit }} caractères.")]
        public string $email,
    ) {}
}
