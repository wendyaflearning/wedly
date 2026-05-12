<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\CredentialsStepRequestDto;
use App\Entity\Vendor\Vendor;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

readonly class CredentialsStepService
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
    ) {}

    public function handle(Vendor $vendor, CredentialsStepRequestDto $dto): void
    {
        $user = $vendor->getUser();

        if ($dto->email !== null) {
            if ($this->userRepository->findOneBy(['email' => $dto->email]) !== null) {
                throw new \DomainException('Email already registered.', 409);
            }
            $user->setEmail($dto->email);
        }

        if ($dto->last_name !== null) {
            $user->setLastName($dto->last_name);
        }

        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $dto->password)
        );

        $vendor->setStatus(VendorStatus::UnderReview);
        $user->setStatus(UserStatus::UnderReview);
    }
}
