<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Event\VendorRejectedEvent;
use App\EventListener\SendVendorRejectionListener;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;

final class SendVendorRejectionListenerTest extends TestCase
{
    public function test_it_sends_rejection_email_to_vendor_email_with_reasons(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (TemplatedEmail $email): bool {
                self::assertSame('camille@example.fr', $email->getTo()[0]->getAddress());
                self::assertSame('Votre profil Wedly nécessite quelques ajustements', $email->getSubject());
                self::assertSame('emails/vendor/vendor_rejection.html.twig', $email->getHtmlTemplate());
                self::assertSame([
                    'Portfolio insuffisant ou de mauvaise qualité',
                ], $email->getContext()['reasons']);

                return true;
            }));

        (new SendVendorRejectionListener($mailer))(new VendorRejectedEvent(
            'Camille',
            'camille@example.fr',
            ['Portfolio insuffisant ou de mauvaise qualité'],
            null,
        ));
    }
}
