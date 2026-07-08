<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ChangePasswordRequestDto
{
    public function __construct(
        #[Assert\NotBlank(message: 'Le mot de passe actuel ne peut pas être vide.')]
        public string $currentPassword,

        #[Assert\NotBlank(message: 'Le nouveau mot de passe ne peut pas être vide.')]
        #[Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.')]
        #[Assert\Regex(pattern: '/[\W_]/', message: 'Le mot de passe doit contenir au moins 1 caractère spécial.')]
        public string $newPassword,

        #[Assert\NotBlank(message: 'La confirmation du mot de passe ne peut pas être vide.')]
        #[Assert\EqualTo(propertyPath: 'newPassword', message: 'Les mots de passe ne correspondent pas.')]
        public string $newPasswordConfirmation,
    ) {}
}
