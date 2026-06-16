<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\VendorValidatedEvent;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;

#[AsEventListener]
readonly class SendVendorInvitationListener
{
    public function __construct(private MailerInterface $mailer) {}

    public function __invoke(VendorValidatedEvent $event): void
    {
        $email = (new TemplatedEmail())
            ->from('contact@wedly-apps.com')
            ->to($event->email)
            ->subject("C'est officiel — vous faites partie de Wedly")
            ->htmlTemplate('emails/vendor/vendor_invitation.html.twig')
            ->context([
                'firstName'    => $event->firstName,
                'dashboardUrl' => $event->dashboardUrl,
            ]);

        $this->mailer->send($email);
    }
}
