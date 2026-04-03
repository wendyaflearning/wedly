<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use App\Enum\Role;
use App\Repository\UserRepository;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class VendorUserProvider implements UserProviderInterface
{
    public function __construct(private readonly UserRepository $userRepository) {}

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $user = $this->userRepository->findOneBy(['email' => $identifier]);

        if (!$user || !in_array(Role::Vendor->value, $user->getRoles(), true)) {
            throw new UserNotFoundException(sprintf('Vendor user "%s" not found.', $identifier));
        }

        return $user;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return User::class === $class || is_subclass_of($class, User::class);
    }
}
