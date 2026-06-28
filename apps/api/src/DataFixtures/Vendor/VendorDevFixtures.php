<?php

declare(strict_types=1);

namespace App\DataFixtures\Vendor;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Confession\ConfessionRepository;
use App\Repository\Culture\CultureRepository;
use App\Repository\Region\RegionRepository;
use App\Repository\Vendor\ServiceRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class VendorDevFixtures extends Fixture implements FixtureGroupInterface
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly RegionRepository $regionRepository,
        private readonly ServiceRepository $serviceRepository,
        private readonly ConfessionRepository $confessionRepository,
        private readonly CultureRepository $cultureRepository,
    ) {}

    public static function getGroups(): array
    {
        return ['dev'];
    }

    public function load(ObjectManager $manager): void
    {
        $idf       = $this->regionRepository->findOneBy(['slug' => 'ile-de-france']);
        $normandie = $this->regionRepository->findOneBy(['slug' => 'normandie']);

        $catholique = $this->confessionRepository->findOneBy(['slug' => 'catholique']);
        $france     = $this->cultureRepository->findOneBy(['slug' => 'france']);

        $serviceFreelance = $this->serviceRepository->findOneBy(['slug' => 'groupe-live']);
        $serviceLieu      = $this->serviceRepository->findOneBy(['slug' => 'lieu-de-reception']);
        $serviceTraiteur  = $this->serviceRepository->findOneBy(['slug' => 'traiteur']);

        // Vendor 1 — Freelance, 5/6 sections complètes (pas de portfolio)
        $user1 = new User();
        $user1->setEmail('claire@wedly.fr')
              ->setFirstName('Claire')
              ->setLastName('Laurent')
              ->setRoles([Role::Vendor->value])
              ->setStatus(UserStatus::Active)
              ->setPassword($this->passwordHasher->hashPassword($user1, 'vendor1234'));
        $manager->persist($user1);

        $vendor1 = new Vendor();
        $vendor1->setUser($user1)
                ->setBrandName('Claire Laurent Photographie')
                ->setSiret('48291736401234')
                ->setPriceType(PriceType::PerService)
                ->setPriceMinCents(240000)
                ->setPriceMaxCents(400000)
                ->setStatus(VendorStatus::Active)
                ->setBio('Photographe de mariage basée en Île-de-France. Je capture vos moments avec authenticité et élégance, en restant toujours discrète pour saisir l\'émotion brute.');

        if ($serviceFreelance !== null) {
            $vendor1->addService($serviceFreelance);
        }
        if ($catholique !== null) {
            $vendor1->addConfession($catholique);
        }
        if ($france !== null) {
            $vendor1->addCulture($france);
        }
        $vendor1->addRegion($idf);
        $vendor1->addRegion($normandie);
        $manager->persist($vendor1);

        $bb1 = (new BookingBlocker())
            ->setVendor($vendor1)
            ->setStartDate(new \DateTimeImmutable('2026-08-02'))
            ->setEndDate(new \DateTimeImmutable('2026-08-04'));
        $manager->persist($bb1);

        $bb2 = (new BookingBlocker())
            ->setVendor($vendor1)
            ->setStartDate(new \DateTimeImmutable('2026-09-13'))
            ->setEndDate(new \DateTimeImmutable('2026-09-15'));
        $manager->persist($bb2);

        // Vendor 2 — Lieu de réception, profil partiel (2/6 + section lieu)
        $user2 = new User();
        $user2->setEmail('orangerie@wedly.fr')
              ->setFirstName('Sophie')
              ->setLastName('Mercier')
              ->setRoles([Role::Vendor->value])
              ->setStatus(UserStatus::Active)
              ->setPassword($this->passwordHasher->hashPassword($user2, 'vendor1234'));
        $manager->persist($user2);

        $vendor2 = new Vendor();
        $vendor2->setUser($user2)
                ->setBrandName("L'Orangerie du Parc")
                ->setSiret('73641928500021')
                ->setPriceType(PriceType::PerPerson)
                ->setPriceMinCents(8500)
                ->setPriceMaxCents(18000)
                ->setStatus(VendorStatus::Active);

        if ($serviceLieu !== null) {
            $vendor2->addService($serviceLieu);
        }
        $vendor2->addRegion($idf);
        $manager->persist($vendor2);

        // Vendor 3 — Traiteur, profil partiel (1/6 + section traiteur)
        $user3 = new User();
        $user3->setEmail('traiteur@wedly.fr')
              ->setFirstName('Thomas')
              ->setLastName('Blanc')
              ->setRoles([Role::Vendor->value])
              ->setStatus(UserStatus::Active)
              ->setPassword($this->passwordHasher->hashPassword($user3, 'vendor1234'));
        $manager->persist($user3);

        $vendor3 = new Vendor();
        $vendor3->setUser($user3)
                ->setBrandName('Blanc Traiteur & Réceptions')
                ->setPriceType(PriceType::PerPerson)
                ->setPriceMinCents(9000)
                ->setPriceMaxCents(22000)
                ->setStatus(VendorStatus::Active);

        if ($serviceTraiteur !== null) {
            $vendor3->addService($serviceTraiteur);
        }
        $manager->persist($vendor3);

        $manager->flush();
    }
}
