<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\ProviderLeadCreatedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Prévient le prestataire qu'un couple souhaite le contacter (WED-51).
 *
 * Même forme que `VendorOnboardingConfirmationEmailListener` : l'envoi ne doit
 * jamais faire échouer la demande du couple, qui est déjà committée quand cet
 * event part. Un mail perdu est un incident Sentry, pas un 500 sur un parcours
 * réussi — le prestataire retrouvera la demande sur son dashboard, et le badge
 * ne dépend pas de cet email.
 *
 * Le contexte Twig est recopié de l'event et de rien d'autre : c'est ce qui
 * garantit qu'aucune donnée sensible (culture, confession) n'atteint le
 * template, puisque l'event ne la porte pas.
 */
#[AsEventListener]
readonly class VendorNewLeadNotificationEmailListener
{
    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ProviderLeadCreatedEvent $event): void
    {
        try {
            $email = (new TemplatedEmail())
                ->from(new Address('contact@wedly-apps.com', 'Wedly'))
                ->to($event->vendorEmail)
                ->subject('Un couple souhaite vous rencontrer sur Wedly')
                ->htmlTemplate('emails/vendor/new_lead_notification.html.twig')
                ->context([
                    'firstName'       => $event->vendorFirstName,
                    'coupleFirstName' => $event->coupleFirstName,
                    'weddingDate'     => $event->weddingDate->format('d/m/Y'),
                    'guestCount'      => $event->guestCount,
                    'budget'          => $this->formatBudget($event->budgetCents),
                    'category'        => $event->category,
                    'specialtyTags'   => $event->specialtyTags,
                    'dashboardUrl'    => $this->frontendUrl . '/dashboard',
                ]);

            $this->mailer->send($email);
        } catch (\Throwable $e) {
            $this->logger->error('Vendor new lead notification email failed.', [
                'leadId'    => $event->leadId,
                'vendorId'  => $event->vendorId,
                'exception' => $e,
            ]);
        }
    }

    /**
     * Les centimes sont la vérité en base ; l'euro est un affichage, et il se
     * décide ici plutôt que dans le template — un `{{ budget / 100 }}` en Twig
     * produirait une division flottante sur une valeur monétaire.
     *
     * Arrondi à l'euro : un budget de mariage se lit en milliers, les centimes
     * n'apportent rien à la décision du prestataire.
     */
    private function formatBudget(int $budgetCents): string
    {
        return number_format(intdiv($budgetCents, 100), 0, ',', ' ') . ' €';
    }
}
