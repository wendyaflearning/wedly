<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VendorFeedbackRequestDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'Le message ne peut pas être vide.')]
        #[Assert\Length(
            max: 5000,
            maxMessage: 'Le message ne peut pas dépasser {{ limit }} caractères.',
        )]
        public string $message,
    ) {}
}
