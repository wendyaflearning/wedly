<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\User\Role;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use App\DTO\Vendor\CreateVendorInputDto;
use App\DTO\Vendor\VendorCreatedResponseDto;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class VendorService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function createVendor(CreateVendorInputDto $dto, UserInterface $adminUser): VendorCreatedResponseDto
    {
        if ($this->userRepository->findOneBy(['email' => $dto->email]) !== null) {
            throw new \DomainException('Email already registered.', 409);
        }

        $service = $this->em->find(Service::class, $dto->service_id);
        if ($service === null) {
            throw new \DomainException('Service not found.', 404);
        }

        $regions = $this->em->getRepository(Region::class)->findBy(['id' => $dto->regions]);
        if (count($regions) !== count($dto->regions)) {
            throw new \DomainException('One or more regions not found.', 422);
        }

        $this->em->beginTransaction();
        try {
            $user = new User();
            $user->setFirstName($dto->firstname)
                 ->setEmail($dto->email)
                 ->setRoles([Role::Vendor->value])
                 ->setPassword($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32))));

            $vendor = new Vendor();
            $vendor->setUser($user)
                   ->setBrandName($dto->brand_name)
                   ->setPriceType($dto->price_type)
                   ->setPriceMinCents($dto->price_min)
                   ->setPriceMaxCents($dto->price_max)
                   ->setStatus(VendorStatus::Pending);

            $vendor->addService($service);

            foreach ($regions as $region) {
                $vendor->addRegion($region);
            }

            $inviteToken = new InviteToken();
            $inviteToken->setToken(bin2hex(random_bytes(64)))
                        ->setCreatedBy($adminUser)
                        ->setPersona(InviteTokenPersona::Vendor)
                        ->setStatus(InviteTokenStatus::Pending)
                        ->setUser($user)
                        ->setVendor($vendor)
                        ->setExpiresAt(new \DateTimeImmutable('+30 days'));

            $this->em->persist($user);
            $this->em->persist($vendor);
            $this->em->persist($inviteToken);
            $this->em->flush();
            $this->em->commit();
        } catch (\Throwable $e) {
            $this->em->rollback();
            throw $e;
        }

        return new VendorCreatedResponseDto($vendor, $user, $inviteToken, $service, $regions);
    }
}
