<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class UpdateBioRequestDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'La bio ne peut pas être vide.')]
        #[Assert\Length(
            min: 50,
            max: 300,
            minMessage: 'La bio doit contenir au moins {{ limit }} caractères.',
            maxMessage: 'La bio ne peut pas dépasser {{ limit }} caractères.',
        )]
        public string $bio,
    ) {}
}
