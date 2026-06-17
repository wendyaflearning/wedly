<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\StepperSubmittedEvent;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

#[AsEventListener]
readonly class SendStepperConfirmationListener
{
    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    public function __invoke(StepperSubmittedEvent $event): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('contact@wedly-apps.com', 'Wedly'))
            ->to($event->email)
            ->subject('Votre profil est entre nos mains — on revient vers vous très vite')
            ->htmlTemplate('emails/vendor/stepper_confirmation.html.twig')
            ->context([
                'firstName'    => $event->firstName,
                'dashboardUrl' => $this->frontendUrl . '/dashboard',
            ]);

        $this->mailer->send($email);
    }
}
