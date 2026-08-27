<?php

declare(strict_types=1);

namespace App\Tests\Unit\Command\Vendor;

use App\Command\Vendor\SendWeddreamLaunchEmailCommand;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\InviteTokenRepository;
use App\Repository\Vendor\VendorEmailLogRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorWeddreamLaunchEmailService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;
use Symfony\Component\Uid\UuidV7;

/**
 * VendorWeddreamLaunchEmailService est `final readonly` : PHPUnit ne peut pas le doubler.
 * Les tests instancient donc le vrai service avec ses collaborateurs mockés — les outcomes
 * (Sent / Skipped / Failed) se pilotent par VendorEmailLogRepository et MailerInterface.
 */
final class SendWeddreamLaunchEmailCommandTest extends TestCase
{
    private const FRONTEND_URL = 'https://app.wedly.test';
    private const VENDOR_ID    = '0198f6ba-1f2c-7c4d-9a1b-8c3d4e5f6a7b';

    public function test_it_refuses_to_run_without_any_targeting_mode(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->never())->method('findEligibleForWeddreamLaunch');

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::INVALID, $tester->execute([]));
        self::assertStringContainsString('Un seul mode de ciblage doit être actif', $this->display($tester));
    }

    public function test_it_refuses_two_targeting_modes_at_once(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->never())->method('findEligibleForWeddreamLaunch');

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::INVALID, $tester->execute(['--vendor' => self::VENDOR_ID, '--all' => true]));
        self::assertStringContainsString('Un seul mode de ciblage doit être actif', $this->display($tester));
    }

    public function test_it_rejects_a_malformed_vendor_id_before_reaching_the_repository(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->never())->method('findEligibleForWeddreamLaunch');

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::INVALID, $tester->execute(['--vendor' => 'not-an-uuid']));
        self::assertStringContainsString('Identifiant prestataire invalide', $this->display($tester));
    }

    public function test_it_rejects_a_malformed_email_before_reaching_the_repository(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->never())->method('findEligibleForWeddreamLaunch');

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::INVALID, $tester->execute(['--email' => 'camille(at)example.fr']));
        self::assertStringContainsString('Email invalide', $this->display($tester));
    }

    public function test_it_rejects_an_unknown_status_value(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->never())->method('findEligibleForWeddreamLaunch');

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::INVALID, $tester->execute(['--status' => 'xyz']));
        self::assertStringContainsString('Valeur invalide pour --status : "xyz"', $this->display($tester));
    }

    public function test_a_direct_targeting_matching_nobody_is_a_blocking_failure(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findEligibleForWeddreamLaunch')
            ->with(self::VENDOR_ID, null, null)
            ->willReturn([]);

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::FAILURE, $tester->execute(['--vendor' => self::VENDOR_ID]));
        self::assertStringContainsString('Aucun prestataire éligible ne correspond à ce ciblage direct', $this->display($tester));
    }

    public function test_a_status_targeting_matching_nobody_is_an_empty_batch_not_an_error(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findEligibleForWeddreamLaunch')
            ->with(null, null, VendorStatus::Active)
            ->willReturn([]);

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::SUCCESS, $tester->execute(['--status' => 'active']));
        self::assertStringContainsString('Aucun prestataire éligible trouvé pour ce ciblage', $this->display($tester));
    }

    public function test_status_brouillon_targets_pending_vendors(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findEligibleForWeddreamLaunch')
            ->with(null, null, VendorStatus::Pending)
            ->willReturn([]);

        $tester = $this->makeTester($vendorRepository);

        self::assertSame(Command::SUCCESS, $tester->execute(['--status' => 'brouillon']));
    }

    public function test_a_batch_with_mixed_outcomes_succeeds_and_reports_each_of_them(): void
    {
        $skipped = $this->makeVendor('Studio Camille', 'camille@example.fr');
        $sent    = $this->makeVendor('Fleurs & Co', 'lou@example.fr');
        $failed  = $this->makeVendor('Traiteur Nord', 'sam@example.fr');

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findEligibleForWeddreamLaunch')
            ->with(null, null, null)
            ->willReturn([$skipped, $sent, $failed]);

        $vendorEmailLogRepository = $this->createStub(VendorEmailLogRepository::class);
        $vendorEmailLogRepository->method('hasBeenSuccessfullySent')
            ->willReturnCallback(static fn(Vendor $vendor): bool => $vendor === $skipped);

        $mailer = $this->createStub(MailerInterface::class);
        $mailer->method('send')->willReturnCallback(static function (RawMessage $message): void {
            $recipients = $message instanceof Email ? $message->getTo() : [];
            foreach ($recipients as $recipient) {
                if ($recipient->getAddress() === 'sam@example.fr') {
                    throw new \RuntimeException('SMTP indisponible');
                }
            }
        });

        $tester = $this->makeTester(
            $vendorRepository,
            $this->makeService($vendorEmailLogRepository, $mailer),
        );

        self::assertSame(Command::SUCCESS, $tester->execute(['--all' => true]));

        $display = $this->display($tester);
        self::assertStringContainsString('Studio Camille', $display);
        self::assertStringContainsString('Skippé', $display);
        self::assertStringContainsString('Envoyé', $display);
        self::assertStringContainsString('Échec', $display);
        self::assertStringContainsString('SMTP indisponible', $display);
        self::assertStringContainsString('Prestataires éligibles : 3', $display);
        self::assertStringContainsString('Envoyés : 1', $display);
        self::assertStringContainsString('Skippés : 1', $display);
        self::assertStringContainsString('En échec : 1', $display);
        // Au moins un échec : le résumé sort en warning, pas en success.
        self::assertStringContainsString('[WARNING]', $display);
    }

    public function test_dry_run_announces_itself_and_counts_what_would_be_sent(): void
    {
        $vendor = $this->makeVendor('Studio Camille', 'camille@example.fr');

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findEligibleForWeddreamLaunch')
            ->willReturn([$vendor]);

        $vendorEmailLogRepository = $this->createStub(VendorEmailLogRepository::class);
        $vendorEmailLogRepository->method('hasBeenSuccessfullySent')->willReturn(false);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->never())->method('send');

        $tester = $this->makeTester(
            $vendorRepository,
            $this->makeService($vendorEmailLogRepository, $mailer),
        );

        self::assertSame(Command::SUCCESS, $tester->execute(['--all' => true, '--dry-run' => true]));

        $display = $this->display($tester);
        self::assertStringContainsString('Mode DRY-RUN', $display);
        self::assertStringContainsString('Dry-run', $display);
        self::assertStringContainsString('À envoyer : 1', $display);
        self::assertStringContainsString('En échec : 0', $display);
    }

    public function test_force_is_forwarded_to_the_service_and_bypasses_the_already_sent_guard(): void
    {
        $vendor = $this->makeVendor('Studio Camille', 'camille@example.fr');

        $vendorRepository = $this->createStub(VendorRepository::class);
        $vendorRepository->method('findEligibleForWeddreamLaunch')->willReturn([$vendor]);

        $vendorEmailLogRepository = $this->createMock(VendorEmailLogRepository::class);
        $vendorEmailLogRepository->expects($this->never())->method('hasBeenSuccessfullySent');

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $tester = $this->makeTester(
            $vendorRepository,
            $this->makeService($vendorEmailLogRepository, $mailer),
        );

        self::assertSame(Command::SUCCESS, $tester->execute(['--all' => true, '--force' => true]));
        self::assertStringContainsString('Envoyés : 1', $this->display($tester));
    }

    private function makeTester(
        VendorRepository $vendorRepository,
        ?VendorWeddreamLaunchEmailService $emailService = null,
    ): CommandTester {
        return new CommandTester(new SendWeddreamLaunchEmailCommand(
            $vendorRepository,
            $emailService ?? $this->makeService(),
        ));
    }

    private function makeService(
        ?VendorEmailLogRepository $vendorEmailLogRepository = null,
        ?MailerInterface $mailer = null,
    ): VendorWeddreamLaunchEmailService {
        return new VendorWeddreamLaunchEmailService(
            $vendorEmailLogRepository ?? $this->createStub(VendorEmailLogRepository::class),
            $this->createStub(InviteTokenRepository::class),
            $this->createStub(EntityManagerInterface::class),
            $mailer ?? $this->createStub(MailerInterface::class),
            new NullLogger(),
            self::FRONTEND_URL,
        );
    }

    /** Tous les vendors sont Active : le CTA se résout sans toucher aux invite tokens. */
    private function makeVendor(string $brandName, string $email): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail($email)
            ->setPassword('password');

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName($brandName)
            ->setStatus(VendorStatus::Active);
        $this->setPrivateProperty($vendor, 'id', new UuidV7());

        return $vendor;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        (new \ReflectionProperty($object, $property))->setValue($object, $value);
    }

    /** Les blocs SymfonyStyle sont wrappés à la largeur du terminal : on normalise avant d'assert. */
    private function display(CommandTester $tester): string
    {
        return trim(preg_replace('/\s+/', ' ', $tester->getDisplay()) ?? '');
    }
}
