<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use App\Service\Vendor\AdminVendorDraftService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\UuidV7;

final class AdminVendorDraftServiceTest extends TestCase
{
    public function test_create_draft_persists_vendor_without_invitation_token(): void
    {
        $service = $this->makeServiceEntity();
        $region = $this->makeRegion();
        $persistedInviteToken = null;

        $entityManager = $this->makeEntityManager($service, $region);
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->once())->method('commit');
        $entityManager->expects($this->never())->method('rollback');
        $entityManager->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (object $entity) use (&$persistedInviteToken): void {
                if ($entity instanceof User || $entity instanceof Vendor) {
                    $this->setPrivateProperty($entity, 'id', new UuidV7());
                }
                if ($entity instanceof InviteToken) {
                    $persistedInviteToken = $entity;
                }
            });
        $entityManager->expects($this->once())->method('flush');

        $response = $this->makeDraftService($entityManager)->create($this->makeValidRequest());

        self::assertNull($persistedInviteToken);
        self::assertSame('pending', $response->status);
        self::assertNull($response->invitation);
        self::assertSame('Studio Camille', $response->identity['brandName']);
    }

    public function test_create_empty_draft_is_accepted_with_masked_internal_values(): void
    {
        $entityManager = $this->makeEntityManager($this->makeServiceEntity(), $this->makeRegion());
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->once())->method('commit');
        $entityManager->expects($this->never())->method('rollback');
        $entityManager->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (object $entity): void {
                if ($entity instanceof User || $entity instanceof Vendor) {
                    $this->setPrivateProperty($entity, 'id', new UuidV7());
                }
            });
        $entityManager->expects($this->once())->method('flush');

        $response = $this->makeDraftService($entityManager)
            ->create(AdminVendorDraftRequestDto::fromArray([]));

        self::assertSame('pending', $response->status);
        self::assertSame('', $response->identity['firstname']);
        self::assertSame('', $response->identity['email']);
        self::assertSame('', $response->identity['brandName']);
        self::assertNull($response->profession['serviceId']);
        self::assertSame([], $response->zonesPricing['regions']);
        self::assertNull($response->zonesPricing['priceMin']);
        self::assertNull($response->zonesPricing['priceMax']);
    }

    public function test_update_can_clear_draft_core_fields(): void
    {
        $vendor = $this->makeReadyVendor();
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('find');
        $entityManager->expects($this->once())->method('flush');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findLatestVendorInvitation')->willReturn(null);

        $response = $this->makeDraftService($entityManager, $inviteTokenRepository)
            ->update($vendor, AdminVendorDraftRequestDto::fromArray([
                'firstname'  => '',
                'email'      => '',
                'brand_name' => '',
                'service_id' => '',
                'price_min'  => null,
                'price_max'  => null,
            ]));

        self::assertSame('', $response->identity['firstname']);
        self::assertSame('', $response->identity['email']);
        self::assertSame('', $response->identity['brandName']);
        self::assertNull($response->profession['serviceId']);
        self::assertNull($response->zonesPricing['priceMin']);
        self::assertNull($response->zonesPricing['priceMax']);
        self::assertTrue($vendor->getServices()->isEmpty());
        self::assertSame(-1, $vendor->getPriceMinCents());
        self::assertSame(-1, $vendor->getPriceMaxCents());
    }

    public function test_update_rejects_partial_patch_turning_multi_zone_vendor_into_creator(): void
    {
        $vendor = $this->makeReadyVendor();
        $vendor->addRegion($this->makeRegion('Normandie', 'normandie'));

        $creatorService = $this->makeServiceEntity(VendorType::Createurs, 'createurs', 'Créateurs');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('find')
            ->with(Service::class, 'creator-service-id')
            ->willReturn($creatorService);
        $entityManager->expects($this->never())->method('flush');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Un créateur possède un seul atelier');

        $this->makeDraftService($entityManager, $inviteTokenRepository)
            ->update($vendor, AdminVendorDraftRequestDto::fromArray([
                'service_id' => 'creator-service-id',
            ]));
    }

    public function test_update_rejects_vendor_with_used_invitation(): void
    {
        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(true);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        $this->makeDraftService(inviteTokenRepository: $inviteTokenRepository)
            ->update($this->makeReadyVendor(), $this->makeValidRequest());
    }

    public function test_delete_removes_pending_draft_without_invitation(): void
    {
        $vendor = $this->makeReadyVendor();
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->exactly(2))->method('remove');
        $entityManager->expects($this->once())->method('flush');
        $entityManager->expects($this->once())->method('commit');
        $entityManager->expects($this->never())->method('rollback');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasVendorInvitation')->willReturn(false);

        $this->makeDraftService($entityManager, $inviteTokenRepository)->delete($vendor);
    }

    public function test_delete_rejects_draft_with_existing_invitation(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('beginTransaction');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasVendorInvitation')->willReturn(true);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->expectExceptionMessage('Ce brouillon ne peut pas être supprimé.');

        $this->makeDraftService($entityManager, $inviteTokenRepository)->delete($this->makeReadyVendor());
    }

    public function test_delete_rejects_non_pending_vendor(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('beginTransaction');

        $vendor = $this->makeReadyVendor()->setStatus(VendorStatus::Active);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->expectExceptionMessage('Ce brouillon ne peut pas être supprimé.');

        $this->makeDraftService($entityManager)->delete($vendor);
    }

    private function makeDraftService(
        ?EntityManagerInterface $entityManager = null,
        ?InviteTokenRepository $inviteTokenRepository = null,
    ): AdminVendorDraftService {
        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn(null);

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');

        return new AdminVendorDraftService(
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $userRepository,
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $passwordHasher,
        );
    }

    private function makeValidRequest(): AdminVendorDraftRequestDto
    {
        return new AdminVendorDraftRequestDto(
            firstname:               'Camille',
            lastName:                'Martin',
            email:                   'camille@example.fr',
            brandName:               'Studio Camille',
            serviceId:               'service-id',
            regions:                 ['region-id'],
            priceMin:                100000,
            priceMax:                250000,
            priceType:               PriceType::PerService->value,
            experiences:             null,
            legalInfo:               null,
            venueCharacteristics:    null,
            cateringCharacteristics: null,
        );
    }

    private function makeReadyVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.fr')
            ->setPassword('password');
        $this->setPrivateProperty($user, 'id', new UuidV7());

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille')
            ->setStatus(VendorStatus::Pending)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100000)
            ->setPriceMaxCents(250000);
        $this->setPrivateProperty($vendor, 'id', new UuidV7());
        $vendor->addService($this->makeServiceEntity());
        $vendor->addRegion($this->makeRegion());

        return $vendor;
    }

    private function makeServiceEntity(
        VendorType $category = VendorType::Freelance,
        string $slug = 'photographe',
        string $name = 'Photographe',
    ): Service {
        $service = (new Service())
            ->setName($name)
            ->setSlug($slug)
            ->setSortOrder(1)
            ->setCategory($category);
        $this->setPrivateProperty($service, 'id', new UuidV7());

        return $service;
    }

    private function makeRegion(string $name = 'Île-de-France', string $slug = 'ile-de-france'): Region
    {
        $region = (new Region())->setName($name)->setSlug($slug);
        $this->setPrivateProperty($region, 'id', new UuidV7());

        return $region;
    }

    private function makeEntityManager(Service $service, Region $region): EntityManagerInterface&\PHPUnit\Framework\MockObject\MockObject
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->method('find')->willReturnCallback(
            fn(string $className, string $id): ?object => match ($className) {
                Service::class => $id === 'service-id' ? $service : null,
                Region::class => $id === 'region-id' ? $region : null,
                default => null,
            }
        );

        return $entityManager;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
