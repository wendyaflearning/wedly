<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\ProviderLeadAcceptedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Prévient le couple que le prestataire a accepté sa demande (WED-54).
 *
 * Même forme que `VendorNewLeadNotificationEmailListener` : l'envoi ne doit
 * jamais faire échouer la décision du prestataire, déjà committée quand cet
 * event part. Un mail perdu est un incident Sentry, pas un 500 sur une
 * acceptation réussie — le couple retrouve la fiche débloquée dans son espace,
 * l'écran ne dépend pas de cet email.
 *
 * Le contexte Twig est recopié de l'event et de rien d'autre.
 */
#[AsEventListener]
readonly class CoupleLeadAcceptedEmailListener
{
    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ProviderLeadAcceptedEvent $event): void
    {
        try {
            $email = (new TemplatedEmail())
                ->from(new Address('contact@wedly-apps.com', 'Wedly'))
                ->to($event->coupleEmail)
                ->subject(sprintf('%s a accepté votre demande de mise en relation', $event->vendorBrandName))
                ->htmlTemplate('emails/couple/lead_accepted.html.twig')
                ->context([
                    'firstName'       => $event->coupleFirstName,
                    'vendorBrandName' => $event->vendorBrandName,
                    // Directement sur la fiche débloquée, pas sur la liste : le mail
                    // annonce des coordonnées, le clic doit les montrer.
                    'leadUrl'         => $this->frontendUrl . '/mon-espace/demandes/' . $event->leadId,
                ]);

            $this->mailer->send($email);
        } catch (\Throwable $e) {
            $this->logger->error('Couple lead accepted email failed.', [
                'leadId'    => $event->leadId,
                'exception' => $e,
            ]);
        }
    }
}
