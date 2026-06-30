<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use App\Service\Vendor\AdminVendorDraftService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
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

    public function test_send_invitation_creates_pending_token_and_sends_email(): void
    {
        $vendor = $this->makeReadyVendor();
        $persistedInviteToken = null;

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(InviteToken::class))
            ->willReturnCallback(function (InviteToken $inviteToken) use (&$persistedInviteToken): void {
                $persistedInviteToken = $inviteToken;
            });
        $entityManager->expects($this->once())->method('flush');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findActiveVendorInvitation')->willReturn(null);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (TemplatedEmail $email): bool {
                self::assertSame('camille@example.fr', $email->getTo()[0]->getAddress());
                self::assertSame('Complétez votre profil Wedly', $email->getSubject());
                self::assertSame('emails/vendor/vendor_admin_invitation.html.twig', $email->getHtmlTemplate());

                return true;
            }));

        $response = $this->makeDraftService($entityManager, $inviteTokenRepository, $mailer)
            ->sendInvitation($vendor, new User());

        self::assertInstanceOf(InviteToken::class, $persistedInviteToken);
        self::assertSame(InviteTokenStatus::Pending, $persistedInviteToken->getStatus());
        self::assertSame(InviteTokenPersona::Vendor, $persistedInviteToken->getPersona());
        self::assertGreaterThan(new \DateTimeImmutable('+29 days'), $persistedInviteToken->getExpiresAt());
        self::assertTrue($response->emailSent);
        self::assertStringContainsString('/onboarding/', $response->invitationUrl);
    }

    public function test_send_invitation_reuses_existing_active_token(): void
    {
        $vendor = $this->makeReadyVendor();
        $activeToken = (new InviteToken())
            ->setToken('active-token')
            ->setStatus(InviteTokenStatus::Pending)
            ->setPersona(InviteTokenPersona::Vendor)
            ->setVendor($vendor)
            ->setUser($vendor->getUser())
            ->setExpiresAt(new \DateTimeImmutable('+10 days'));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findActiveVendorInvitation')->willReturn($activeToken);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $response = $this->makeDraftService($entityManager, $inviteTokenRepository, $mailer)
            ->sendInvitation($vendor, new User());

        self::assertSame('active-token', $response->inviteToken);
    }

    public function test_send_invitation_rejects_incomplete_vendor(): void
    {
        $vendor = (new Vendor())->setUser((new User())->setFirstName('Camille')->setEmail('camille@example.fr')->setPassword('password'));
        $vendor->setBrandName('Studio Camille')->setPriceType(PriceType::PerService)->setPriceMinCents(100)->setPriceMaxCents(200);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeDraftService(mailer: $mailer)->sendInvitation($vendor, new User());
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

    private function makeDraftService(
        ?EntityManagerInterface $entityManager = null,
        ?InviteTokenRepository $inviteTokenRepository = null,
        ?MailerInterface $mailer = null,
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
            $mailer ?? $this->createStub(MailerInterface::class),
            'https://app.wedly.test',
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

    private function makeServiceEntity(): Service
    {
        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(1)
            ->setCategory(VendorType::Freelance);
        $this->setPrivateProperty($service, 'id', new UuidV7());

        return $service;
    }

    private function makeRegion(): Region
    {
        $region = (new Region())->setName('Île-de-France')->setSlug('ile-de-france');
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
