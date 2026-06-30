<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Event\VendorValidatedEvent;
use App\EventListener\SendVendorInvitationListener;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;

final class SendVendorInvitationListenerTest extends TestCase
{
    public function test_it_sends_validation_email_to_vendor_email(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (TemplatedEmail $email): bool {
                self::assertSame('camille@example.fr', $email->getTo()[0]->getAddress());
                self::assertSame("C'est officiel, vous faites partie de Wedly", $email->getSubject());
                self::assertSame('emails/vendor/vendor_invitation.html.twig', $email->getHtmlTemplate());

                return true;
            }));

        (new SendVendorInvitationListener($mailer))(new VendorValidatedEvent(
            'Camille',
            'camille@example.fr',
            'https://wedly.test/dashboard',
        ));
    }
}
