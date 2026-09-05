<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\ProviderLeadRefusedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Annonce au couple que sa demande n'a pas été retenue (WED-53).
 *
 * Le prestataire n'est nommé nulle part — ni dans l'objet du mail, ni dans le
 * corps : un refus laisse la demande masquée côté couple (PROVIDER-LEAD-005), et
 * l'email n'a pas à en dire plus que l'écran. C'est `ProviderLeadRefusedEvent`
 * qui le garantit, en ne portant simplement pas l'information.
 *
 * Comme l'acceptation : l'envoi ne peut pas faire échouer la décision, déjà
 * committée.
 */
#[AsEventListener]
readonly class CoupleLeadRefusedEmailListener
{
    /**
     * Un seul motif, générique, pour cette version : le prestataire tranche sans
     * choisir de raison (décision du 03/09), il n'y a donc rien à traduire en
     * formulation adoucie. La phrase reste vraie quel que soit le vrai motif, et
     * ne fait porter au couple aucun jugement sur son projet.
     */
    private const SOFTENED_REASON =
        'Ce prestataire ne peut malheureusement pas donner suite à votre demande.';

    public function __construct(
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ProviderLeadRefusedEvent $event): void
    {
        try {
            $email = (new TemplatedEmail())
                ->from(new Address('contact@wedly-apps.com', 'Wedly'))
                ->to($event->coupleEmail)
                ->subject('Réponse à votre demande de mise en relation')
                ->htmlTemplate('emails/couple/lead_refused.html.twig')
                ->context([
                    'firstName'    => $event->coupleFirstName,
                    'reason'       => self::SOFTENED_REASON,
                    // « d'autres photographes » quand la catégorie est connue,
                    // « d'autres prestataires » sinon : la phrase doit rester lisible
                    // sur un lead dont la photo ne porte aucun tag de métier.
                    'categoryPlural' => $this->pluralizeCategory($event->category),
                    'galleryUrl'   => $this->frontendUrl . '/wedream',
                ]);

            $this->mailer->send($email);
        } catch (\Throwable $e) {
            $this->logger->error('Couple lead refused email failed.', [
                'leadId'    => $event->leadId,
                'exception' => $e,
            ]);
        }
    }

    /**
     * Les catégories sont saisies au singulier (« Photographe »). Le pluriel est
     * un affichage, il se décide ici plutôt que dans le template.
     */
    private function pluralizeCategory(?string $category): string
    {
        if ($category === null || $category === '') {
            return 'prestataires';
        }

        $lower = mb_strtolower($category);

        return str_ends_with($lower, 's') || str_ends_with($lower, 'x') ? $lower : $lower . 's';
    }
}
