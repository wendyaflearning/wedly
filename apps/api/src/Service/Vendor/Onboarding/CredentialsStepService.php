<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\CredentialsStepRequestDto;
use App\Entity\Vendor\Vendor;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class CredentialsStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::Credentials;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var CredentialsStepRequestDto $dto */
        $dto  = $this->validate(CredentialsStepRequestDto::fromArray($data));
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
