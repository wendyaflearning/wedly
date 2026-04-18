<?php

declare(strict_types=1);

namespace App\Vendor\Service;

use App\Entity\InviteToken;
use App\Entity\Region;
use App\Entity\Service;
use App\Entity\User;
use App\Entity\Vendor;
use App\Enum\InviteTokenPersona;
use App\Enum\InviteTokenStatus;
use App\Enum\Role;
use App\Repository\UserRepository;
use App\Vendor\Dto\CreateVendorInput;
use App\Vendor\Dto\VendorCreatedResponse;
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

    public function createVendor(CreateVendorInput $dto, UserInterface $adminUser): VendorCreatedResponse
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
                   ->setIsValidated(false)
                   ->setIsActive(false);

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

        return new VendorCreatedResponse($vendor, $user, $inviteToken, $service, $regions);
    }
}
