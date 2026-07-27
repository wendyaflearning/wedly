<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Event\VendorOnboardingSubmittedEvent;
use App\EventListener\SendStepperConfirmationListener;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;

final class SendStepperConfirmationListenerTest extends TestCase
{
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

        (new SendStepperConfirmationListener($mailer, 'https://wedly.test'))(
            new VendorOnboardingSubmittedEvent(
                vendorId: '01960000-0000-7000-8000-000000000000',
                firstName: 'Sophie',
                lastName: 'Dupont',
                email: 'sophie@example.fr',
                brand: 'Sophie Fleurs',
                category: 'freelance',
                regions: ['Île-de-France'],
                submittedForReviewAt: new \DateTimeImmutable(),
                isFirstSubmission: true,
            )
        );
    }
}
