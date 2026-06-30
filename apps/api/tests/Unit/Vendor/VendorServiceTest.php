<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Vendor\CreateVendorInputDto;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\User\Role;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Repository\User\UserRepository;
use App\Service\Vendor\VendorService;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\UuidV7;

final class VendorServiceTest extends TestCase
{
    public function test_create_vendor_creates_pending_vendor_invitation_token(): void
    {
        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(1)
            ->setCategory(VendorType::Freelance);
        $this->setPrivateProperty($service, 'id', new UuidV7());

        $region = (new Region())->setName('Île-de-France')->setSlug('ile-de-france');
        $this->setPrivateProperty($region, 'id', new UuidV7());

        $persistedUser = null;
        $persistedVendor = null;
        $persistedInviteToken = null;

        $regionRepository = $this->createStub(EntityRepository::class);
        $regionRepository->method('findBy')->willReturn([$region]);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->once())->method('commit');
        $entityManager->expects($this->never())->method('rollback');
        $entityManager->method('find')->with(Service::class, 'service-id')->willReturn($service);
        $entityManager->method('getRepository')->with(Region::class)->willReturn($regionRepository);
        $entityManager->expects($this->exactly(3))
            ->method('persist')
            ->willReturnCallback(function (object $entity) use (&$persistedUser, &$persistedVendor, &$persistedInviteToken): void {
                if ($entity instanceof User) {
                    $this->setPrivateProperty($entity, 'id', new UuidV7());
                    $persistedUser = $entity;
                }

                if ($entity instanceof Vendor) {
                    $this->setPrivateProperty($entity, 'id', new UuidV7());
                    $persistedVendor = $entity;
                }

                if ($entity instanceof InviteToken) {
                    $persistedInviteToken = $entity;
                }
            });
        $entityManager->expects($this->once())->method('flush');

        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn(null);

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');

        $dto = new CreateVendorInputDto(
            firstname:  'Camille',
            email:      'camille@example.fr',
            brand_name: 'Studio Camille',
            service_id: 'service-id',
            regions:    ['region-id'],
            price_min:  100000,
            price_max:  250000,
            price_type: PriceType::PerService,
        );
        $adminUser = (new User())
            ->setFirstName('Admin')
            ->setEmail('admin@example.fr')
            ->setPassword('password');

        $response = (new VendorService($entityManager, $userRepository, $passwordHasher))
            ->createVendor($dto, $adminUser);

        self::assertInstanceOf(User::class, $persistedUser);
        self::assertInstanceOf(Vendor::class, $persistedVendor);
        self::assertInstanceOf(InviteToken::class, $persistedInviteToken);
        self::assertContains(Role::Vendor->value, $persistedUser->getRoles());
        self::assertSame(VendorStatus::Pending, $persistedVendor->getStatus());
        self::assertSame(InviteTokenPersona::Vendor, $persistedInviteToken->getPersona());
        self::assertSame(InviteTokenStatus::Pending, $persistedInviteToken->getStatus());
        self::assertSame($adminUser, $persistedInviteToken->getCreatedBy());
        self::assertGreaterThan(new \DateTimeImmutable('+29 days'), $persistedInviteToken->getExpiresAt());
        self::assertSame($persistedInviteToken->getToken(), $response->inviteToken);
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
