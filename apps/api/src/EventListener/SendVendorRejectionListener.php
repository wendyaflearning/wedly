<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\VendorRejectedEvent;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

#[AsEventListener]
readonly class SendVendorRejectionListener
{
    public function __construct(private MailerInterface $mailer) {}

    public function __invoke(VendorRejectedEvent $event): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('contact@wedly-apps.com', 'Wedly'))
            ->to($event->email)
            ->subject('Votre profil Wedly nécessite quelques ajustements')
            ->htmlTemplate('emails/vendor/vendor_rejection.html.twig')
            ->context([
                'firstName' => $event->firstName,
                'reasons'   => $event->reasons,
                'note'      => $event->note,
            ]);

        $this->mailer->send($email);
    }
}
