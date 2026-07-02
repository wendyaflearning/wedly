<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

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
use App\Service\Vendor\AdminVendorInvitationService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Uid\UuidV7;

final class AdminVendorInvitationServiceTest extends TestCase
{
    public function test_list_returns_active_vendor_invitations(): void
    {
        $now = new \DateTimeImmutable('2026-06-26 10:00:00');
        $activeInvitations = [new InviteToken()];
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->once())
            ->method('findActiveVendorInvitations')
            ->with($now)
            ->willReturn($activeInvitations);
        $repository->expects($this->never())->method('findExpiredVendorInvitations');

        self::assertSame($activeInvitations, $this->makeService(inviteTokenRepository: $repository)->list('active', $now));
    }

    public function test_list_returns_expired_vendor_invitations(): void
    {
        $now = new \DateTimeImmutable('2026-06-26 10:00:00');
        $expiredInvitations = [new InviteToken()];
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->once())
            ->method('findExpiredVendorInvitations')
            ->with($now)
            ->willReturn($expiredInvitations);
        $repository->expects($this->never())->method('findActiveVendorInvitations');

        self::assertSame($expiredInvitations, $this->makeService(inviteTokenRepository: $repository)->list('expired', $now));
    }

    public function test_list_rejects_invalid_scope(): void
    {
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->never())->method('findActiveVendorInvitations');
        $repository->expects($this->never())->method('findExpiredVendorInvitations');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Invalid invitation scope.');

        $this->makeService(inviteTokenRepository: $repository)->list('all');
    }

    public function test_send_creates_pending_token_and_sends_email(): void
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

        $response = $this->makeService($inviteTokenRepository, $entityManager, $mailer)
            ->send($vendor, new User());

        self::assertInstanceOf(InviteToken::class, $persistedInviteToken);
        self::assertSame(InviteTokenStatus::Pending, $persistedInviteToken->getStatus());
        self::assertSame(InviteTokenPersona::Vendor, $persistedInviteToken->getPersona());
        self::assertGreaterThan(new \DateTimeImmutable('+29 days'), $persistedInviteToken->getExpiresAt());
        self::assertTrue($response->emailSent);
        self::assertStringContainsString('/onboarding/', $response->invitationUrl);
    }

    public function test_send_reuses_existing_active_token(): void
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

        $response = $this->makeService($inviteTokenRepository, $entityManager, $mailer)
            ->send($vendor, new User());

        self::assertSame('active-token', $response->inviteToken);
    }

    public function test_send_returns_false_when_mailer_fails(): void
    {
        $vendor = $this->makeReadyVendor();
        $activeToken = (new InviteToken())
            ->setToken('active-token')
            ->setStatus(InviteTokenStatus::Pending)
            ->setPersona(InviteTokenPersona::Vendor)
            ->setVendor($vendor)
            ->setUser($vendor->getUser())
            ->setExpiresAt(new \DateTimeImmutable('+10 days'));

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findActiveVendorInvitation')->willReturn($activeToken);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->willThrowException(new \RuntimeException('SMTP down'));

        $response = $this->makeService($inviteTokenRepository, mailer: $mailer)
            ->send($vendor, new User());

        self::assertFalse($response->emailSent);
    }

    public function test_send_rejects_incomplete_vendor(): void
    {
        $vendor = (new Vendor())->setUser((new User())->setFirstName('Camille')->setEmail('camille@example.fr')->setPassword('password'));
        $vendor->setBrandName('Studio Camille')->setPriceType(PriceType::PerService)->setPriceMinCents(100)->setPriceMaxCents(200);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService(mailer: $mailer)->send($vendor, new User());
    }

    public function test_send_rejects_used_invitation_and_invalid_price_range(): void
    {
        $usedInvitationRepository = $this->createStub(InviteTokenRepository::class);
        $usedInvitationRepository->method('hasUsedVendorInvitation')->willReturn(true);

        try {
            $this->makeService(inviteTokenRepository: $usedInvitationRepository)->send($this->makeReadyVendor(), new User());
            $this->fail('Expected used invitation exception.');
        } catch (\DomainException $exception) {
            self::assertSame('Invitation already used; vendor draft can no longer be edited.', $exception->getMessage());
        }

        $invalidPriceVendor = $this->makeReadyVendor()->setPriceMinCents(300)->setPriceMaxCents(200);

        try {
            $this->makeService()->send($invalidPriceVendor, new User());
            $this->fail('Expected invalid price range exception.');
        } catch (\DomainException $exception) {
            self::assertSame('Invalid price range.', $exception->getMessage());
        }
    }

    private function makeService(
        ?InviteTokenRepository $inviteTokenRepository = null,
        ?EntityManagerInterface $entityManager = null,
        ?MailerInterface $mailer = null,
    ): AdminVendorInvitationService {
        return new AdminVendorInvitationService(
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $mailer ?? $this->createStub(MailerInterface::class),
            'https://app.wedly.test',
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

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
