<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CredentialsStepRequest implements DTOInterface
{
    public function __construct(
        #[Assert\Email]
        public ?string $email,

        public ?string $last_name,

        #[Assert\NotBlank]
        #[Assert\Length(min: 8)]
        #[Assert\Regex(pattern: '/[\W_]/', message: 'Le mot de passe doit contenir au moins 1 caractère spécial.')]
        public string $password,

        #[Assert\NotBlank]
        #[Assert\EqualTo(propertyPath: 'password')]
        public string $password_confirmation,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            email:                 $data['email'] ?? null,
            last_name:             $data['last_name'] ?? null,
            password:              $data['password'] ?? '',
            password_confirmation: $data['password_confirmation'] ?? '',
        );
    }
}
