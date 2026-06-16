<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\StepperSubmittedEvent;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;

#[AsEventListener]
readonly class SendStepperConfirmationListener
{
    public function __construct(private MailerInterface $mailer) {}

    public function __invoke(StepperSubmittedEvent $event): void
    {
        $email = (new TemplatedEmail())
            ->from('contact@wedly-apps.com')
            ->to($event->email)
            ->subject('Votre profil est entre nos mains — on revient vers vous très vite')
            ->htmlTemplate('emails/vendor/stepper_confirmation.html.twig')
            ->context(['firstName' => $event->firstName]);

        $this->mailer->send($email);
    }
}
