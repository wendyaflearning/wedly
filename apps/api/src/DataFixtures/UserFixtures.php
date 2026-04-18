<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\User;
use App\Enum\Role;
use App\Enum\UserStatus;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function load(ObjectManager $manager): void
    {
        $admin = new User();
        $admin->setEmail('admin@wedly.fr')
              ->setFirstName('Admin')
              ->setLastName('Wedly')
              ->setRoles([Role::Admin->value])
              ->setStatus(UserStatus::Active)
              ->setPassword($this->passwordHasher->hashPassword($admin, 'admin1234'));

        $vendor = new User();
        $vendor->setEmail('vendor@wedly.fr')
               ->setFirstName('Test')
               ->setLastName(null)
               ->setRoles([Role::Vendor->value])
               ->setStatus(UserStatus::Pending)
               ->setPassword($this->passwordHasher->hashPassword($vendor, 'vendor1234'));

        $manager->persist($admin);
        $manager->persist($vendor);
        $manager->flush();
    }
}
