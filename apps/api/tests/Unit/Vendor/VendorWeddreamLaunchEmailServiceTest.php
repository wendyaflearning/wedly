<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorEmailLog;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorEmailLogStatus;
use App\Enum\Vendor\VendorEmailType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorWeddreamLaunchOutcome;
use App\Repository\User\InviteTokenRepository;
use App\Repository\Vendor\VendorEmailLogRepository;
use App\Service\Vendor\VendorWeddreamLaunchEmailService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Uid\UuidV7;

final class VendorWeddreamLaunchEmailServiceTest extends TestCase
{
    private const FRONTEND_URL = 'https://app.wedly.test';

    public function test_send_skips_vendor_already_contacted_successfully(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Active);

        $vendorEmailLogRepository = $this->createMock(VendorEmailLogRepository::class);
        $vendorEmailLogRepository->expects($this->once())
            ->method('hasBeenSuccessfullySent')
            ->with($vendor, VendorEmailType::WeddreamLaunch)
            ->willReturn(true);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $results = $this->makeService(
            vendorEmailLogRepository: $vendorEmailLogRepository,
            entityManager: $entityManager,
            mailer: $mailer,
        )->send([$vendor]);

        self::assertCount(1, $results);
        self::assertSame(VendorWeddreamLaunchOutcome::Skipped, $results[0]->outcome);
        self::assertNull($results[0]->ctaUrl);
    }

    public function test_send_with_force_contacts_vendor_already_contacted_successfully(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Active);

        $vendorEmailLogRepository = $this->createMock(VendorEmailLogRepository::class);
        $vendorEmailLogRepository->expects($this->never())->method('hasBeenSuccessfullySent');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist')->with($this->isInstanceOf(VendorEmailLog::class));
        $entityManager->expects($this->once())->method('flush');

        $results = $this->makeService(
            vendorEmailLogRepository: $vendorEmailLogRepository,
            entityManager: $entityManager,
            mailer: $mailer,
        )->send([$vendor], false, true);

        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[0]->outcome);
    }

    public function test_dry_run_on_active_vendor_neither_sends_nor_writes(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Active);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $results = $this->makeService(entityManager: $entityManager, mailer: $mailer)->send([$vendor], true);

        self::assertSame(VendorWeddreamLaunchOutcome::DryRun, $results[0]->outcome);
        self::assertSame('Accéder à mon espace', $results[0]->ctaLabel);
        self::assertSame(self::FRONTEND_URL . '/dashboard', $results[0]->ctaUrl);
    }

    public function test_dry_run_on_pending_vendor_without_token_creates_nothing(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Pending);

        $inviteTokenRepository = $this->createMock(InviteTokenRepository::class);
        $inviteTokenRepository->expects($this->once())
            ->method('findActiveVendorInvitation')
            ->willReturn(null);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $results = $this->makeService(
            inviteTokenRepository: $inviteTokenRepository,
            entityManager: $entityManager,
            mailer: $mailer,
        )->send([$vendor], true);

        self::assertSame(VendorWeddreamLaunchOutcome::DryRun, $results[0]->outcome);
        self::assertSame('Rejoindre Wedly', $results[0]->ctaLabel);
        self::assertSame(self::FRONTEND_URL . '/onboarding/(token généré au véritable envoi)', $results[0]->ctaUrl);
    }

    public function test_send_to_active_vendor_logs_success_and_targets_dashboard(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Active);
        $persistedLog = null;

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(VendorEmailLog::class))
            ->willReturnCallback(function (VendorEmailLog $log) use (&$persistedLog): void {
                $persistedLog = $log;
            });
        $entityManager->expects($this->once())->method('flush');

        $sentEmail = null;
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->willReturnCallback(function (TemplatedEmail $email) use (&$sentEmail): void {
                $sentEmail = $email;
            });

        $results = $this->makeService(entityManager: $entityManager, mailer: $mailer)->send([$vendor]);

        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[0]->outcome);
        self::assertNull($results[0]->errorMessage);
        self::assertSame(self::FRONTEND_URL . '/dashboard', $results[0]->ctaUrl);

        self::assertInstanceOf(VendorEmailLog::class, $persistedLog);
        self::assertSame($vendor, $persistedLog->getVendor());
        self::assertSame(VendorEmailType::WeddreamLaunch, $persistedLog->getType());
        self::assertSame(VendorEmailLogStatus::Success, $persistedLog->getStatus());
        self::assertNull($persistedLog->getErrorMessage());

        self::assertInstanceOf(TemplatedEmail::class, $sentEmail);
        self::assertSame('WedDream est prêt : on le teste au Salon du Mariage', $sentEmail->getSubject());
        self::assertSame('emails/vendor/vendor_weddream_launch.html.twig', $sentEmail->getHtmlTemplate());
        $context = $sentEmail->getContext();
        self::assertSame('Accéder à mon espace', $context['ctaLabel']);
        self::assertSame(self::FRONTEND_URL . '/dashboard', $context['ctaUrl']);
        self::assertSame('https://tally.so/r/xX5okd', $context['consentFormUrl']);
    }

    public function test_send_to_pending_vendor_creates_token_then_logs_success(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Pending);

        $inviteTokenRepository = $this->createMock(InviteTokenRepository::class);
        $inviteTokenRepository->expects($this->once())
            ->method('findActiveVendorInvitation')
            ->willReturn(null);

        $persisted = [];
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (object $entity) use (&$persisted): void {
                $persisted[] = $entity;
            });
        $entityManager->expects($this->exactly(2))->method('flush');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $results = $this->makeService(
            inviteTokenRepository: $inviteTokenRepository,
            entityManager: $entityManager,
            mailer: $mailer,
        )->send([$vendor]);

        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[0]->outcome);
        self::assertCount(2, $persisted);

        [$inviteToken, $vendorEmailLog] = $persisted;
        self::assertInstanceOf(InviteToken::class, $inviteToken);
        self::assertSame(InviteTokenPersona::Vendor, $inviteToken->getPersona());
        self::assertSame(InviteTokenStatus::Pending, $inviteToken->getStatus());
        self::assertSame($vendor, $inviteToken->getVendor());
        self::assertSame($vendor->getUser(), $inviteToken->getUser());
        self::assertNull($inviteToken->getCreatedBy());
        self::assertSame(128, strlen((string) $inviteToken->getToken()));

        self::assertInstanceOf(VendorEmailLog::class, $vendorEmailLog);
        self::assertSame(VendorEmailLogStatus::Success, $vendorEmailLog->getStatus());

        self::assertSame(self::FRONTEND_URL . '/onboarding/' . $inviteToken->getToken(), $results[0]->ctaUrl);
    }

    public function test_send_reuses_existing_active_invite_token(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Pending);
        $existingToken = (new InviteToken())->setToken('existing-token');

        $inviteTokenRepository = $this->createMock(InviteTokenRepository::class);
        $inviteTokenRepository->expects($this->once())
            ->method('findActiveVendorInvitation')
            ->willReturn($existingToken);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('persist')->with($this->isInstanceOf(VendorEmailLog::class));
        $entityManager->expects($this->once())->method('flush');

        $results = $this->makeService(
            inviteTokenRepository: $inviteTokenRepository,
            entityManager: $entityManager,
        )->send([$vendor]);

        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[0]->outcome);
        self::assertSame(self::FRONTEND_URL . '/onboarding/existing-token', $results[0]->ctaUrl);
    }

    public function test_mailer_failure_is_logged_in_database_and_never_rethrown(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Active);
        $persistedLog = null;

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->willThrowException(new \RuntimeException('SMTP indisponible'));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(VendorEmailLog::class))
            ->willReturnCallback(function (VendorEmailLog $log) use (&$persistedLog): void {
                $persistedLog = $log;
            });
        $entityManager->expects($this->once())->method('flush');

        $results = $this->makeService(entityManager: $entityManager, mailer: $mailer)->send([$vendor]);

        self::assertSame(VendorWeddreamLaunchOutcome::Failed, $results[0]->outcome);
        self::assertSame('SMTP indisponible', $results[0]->errorMessage);

        self::assertInstanceOf(VendorEmailLog::class, $persistedLog);
        self::assertSame(VendorEmailLogStatus::Failed, $persistedLog->getStatus());
        self::assertSame('SMTP indisponible', $persistedLog->getErrorMessage());
    }

    public function test_dry_run_failure_writes_nothing(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Rejected);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $results = $this->makeService(entityManager: $entityManager)->send([$vendor], true);

        self::assertSame(VendorWeddreamLaunchOutcome::Failed, $results[0]->outcome);
        self::assertSame(
            'Statut prestataire inattendu pour un envoi WedDream : rejected',
            $results[0]->errorMessage,
        );
    }

    public function test_failure_on_one_vendor_does_not_interrupt_the_next_ones(): void
    {
        $failingVendor = $this->makeVendor(VendorStatus::Active, 'ko@example.fr');
        $succeedingVendor = $this->makeVendor(VendorStatus::Active, 'ok@example.fr');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->exactly(2))
            ->method('send')
            ->willReturnCallback(function (TemplatedEmail $email): void {
                if ($email->getTo()[0]->getAddress() === 'ko@example.fr') {
                    throw new \RuntimeException('SMTP indisponible');
                }
            });

        $persistedStatuses = [];
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (VendorEmailLog $log) use (&$persistedStatuses): void {
                $persistedStatuses[] = $log->getStatus();
            });
        $entityManager->expects($this->exactly(2))->method('flush');

        $results = $this->makeService(entityManager: $entityManager, mailer: $mailer)
            ->send([$failingVendor, $succeedingVendor]);

        self::assertCount(2, $results);
        self::assertSame(VendorWeddreamLaunchOutcome::Failed, $results[0]->outcome);
        self::assertSame($failingVendor, $results[0]->vendor);
        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[1]->outcome);
        self::assertSame($succeedingVendor, $results[1]->vendor);

        self::assertSame([VendorEmailLogStatus::Failed, VendorEmailLogStatus::Success], $persistedStatuses);
    }

    public function test_recording_failure_that_itself_fails_does_not_interrupt_the_next_ones(): void
    {
        $failingVendor = $this->makeVendor(VendorStatus::Active, 'ko@example.fr');
        $succeedingVendor = $this->makeVendor(VendorStatus::Active, 'ok@example.fr');

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('send')->willReturnCallback(function (TemplatedEmail $email): void {
            if ($email->getTo()[0]->getAddress() === 'ko@example.fr') {
                throw new \RuntimeException('SMTP indisponible');
            }
        });

        $entityManager = $this->createStub(EntityManagerInterface::class);
        $entityManager->method('flush')->willReturnCallback(function (): void {
            static $call = 0;
            if (++$call === 1) {
                throw new \LogicException('EntityManager is closed');
            }
        });

        $results = $this->makeService(entityManager: $entityManager, mailer: $mailer)
            ->send([$failingVendor, $succeedingVendor]);

        self::assertSame(VendorWeddreamLaunchOutcome::Failed, $results[0]->outcome);
        self::assertSame('SMTP indisponible', $results[0]->errorMessage);
        self::assertSame(VendorWeddreamLaunchOutcome::Sent, $results[1]->outcome);
    }

    public function test_send_returns_an_empty_list_for_an_empty_vendor_list(): void
    {
        self::assertSame([], $this->makeService()->send([]));
    }

    private function makeService(
        ?VendorEmailLogRepository $vendorEmailLogRepository = null,
        ?InviteTokenRepository $inviteTokenRepository = null,
        ?EntityManagerInterface $entityManager = null,
        ?MailerInterface $mailer = null,
        ?LoggerInterface $logger = null,
    ): VendorWeddreamLaunchEmailService {
        return new VendorWeddreamLaunchEmailService(
            $vendorEmailLogRepository ?? $this->createStub(VendorEmailLogRepository::class),
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $mailer ?? $this->createStub(MailerInterface::class),
            $logger ?? new NullLogger(),
            self::FRONTEND_URL,
        );
    }

    private function makeVendor(VendorStatus $status, string $email = 'camille@example.fr'): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail($email)
            ->setPassword('password');
        $this->setPrivateProperty($user, 'id', new UuidV7());

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille')
            ->setStatus($status)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100000)
            ->setPriceMaxCents(250000);
        $this->setPrivateProperty($vendor, 'id', new UuidV7());

        return $vendor;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
