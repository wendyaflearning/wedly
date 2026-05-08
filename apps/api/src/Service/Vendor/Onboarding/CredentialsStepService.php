<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\CredentialsStepRequest;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

readonly class CredentialsStepService
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function handle(Vendor $vendor, CredentialsStepRequest $dto): void
    {
        $user = $vendor->getUser();

        if ($dto->email !== null) {
            $user->setEmail($dto->email);
        }

        if ($dto->last_name !== null) {
            $user->setLastName($dto->last_name);
        }

        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $dto->password)
        );

        $vendor->setStatus(VendorStatus::UnderReview);
    }
}
