<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Event\VendorOnboardingSubmittedEvent;
use App\EventListener\VendorOnboardingConfirmationEmailListener;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;

final class VendorOnboardingConfirmationEmailListenerTest extends TestCase
{
    private function makeEvent(): VendorOnboardingSubmittedEvent
    {
        return new VendorOnboardingSubmittedEvent(
            vendorId: '01960000-0000-7000-8000-000000000000',
            firstName: 'Sophie',
            lastName: 'Dupont',
            email: 'sophie@example.fr',
            brand: 'Sophie Fleurs',
            category: 'freelance',
            regions: ['Île-de-France'],
            submittedForReviewAt: new \DateTimeImmutable(),
            isFirstSubmission: true,
        );
    }

    public function test_it_sends_confirmation_to_vendor_email(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (TemplatedEmail $email): bool {
                self::assertSame('sophie@example.fr', $email->getTo()[0]->getAddress());
                self::assertSame('Votre profil est entre nos mains, on revient vers vous très vite', $email->getSubject());
                self::assertSame('emails/vendor/stepper_confirmation.html.twig', $email->getHtmlTemplate());
                self::assertSame('Sophie', $email->getContext()['firstName']);
                self::assertSame('https://wedly.test/dashboard', $email->getContext()['dashboardUrl']);

                return true;
            }));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->never())->method('error');

        (new VendorOnboardingConfirmationEmailListener($mailer, 'https://wedly.test', $logger))(
            $this->makeEvent()
        );
    }

    public function test_it_logs_and_swallows_exception_on_mailer_failure(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send')->willThrowException(new TransportException('SMTP down'));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())
            ->method('error')
            ->with(
                'Vendor onboarding confirmation email failed.',
                $this->callback(function (array $context): bool {
                    self::assertSame('01960000-0000-7000-8000-000000000000', $context['vendorId']);
                    self::assertInstanceOf(TransportException::class, $context['exception']);

                    return true;
                })
            );

        (new VendorOnboardingConfirmationEmailListener($mailer, 'https://wedly.test', $logger))(
            $this->makeEvent()
        );
    }
}
