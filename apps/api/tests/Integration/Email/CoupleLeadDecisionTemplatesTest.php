<?php

declare(strict_types=1);

namespace App\Tests\Integration\Email;

use App\Event\ProviderLeadAcceptedEvent;
use App\Event\ProviderLeadRefusedEvent;
use App\EventListener\CoupleLeadAcceptedEmailListener;
use App\EventListener\CoupleLeadRefusedEmailListener;
use Psr\Log\AbstractLogger;
use Psr\Log\NullLogger;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\RawMessage;
use Twig\Environment;

/**
 * Rend réellement les deux emails de décision (WED-53 / WED-54), à partir du
 * contexte que les listeners construisent — pas d'un contexte réécrit à la main.
 *
 * C'est ce qui donne son sens à l'assertion centrale : vérifier qu'un tableau
 * écrit dans le test ne contient pas le nom du prestataire ne prouverait rien.
 * Ici on capture le `TemplatedEmail` réel et on regarde le HTML effectivement
 * produit.
 */
final class CoupleLeadDecisionTemplatesTest extends KernelTestCase
{
    private const FRONTEND = 'https://app.wedly-apps.test';
    private const VENDOR   = 'Studio Lumière';

    // ── Acceptation ────────────────────────────────────────────────────────

    public function test_the_acceptance_greets_the_couple_and_names_the_vendor(): void
    {
        $html = $this->renderAccepted();

        self::assertStringContainsString('Camille', $html);
        self::assertStringContainsString(self::VENDOR, $html);
        self::assertStringContainsString('a accepté', $html);
    }

    /**
     * Le mail annonce des coordonnées : le clic doit tomber sur la fiche
     * débloquée, pas sur la liste des demandes.
     */
    public function test_the_acceptance_links_straight_to_the_unlocked_lead(): void
    {
        self::assertStringContainsString(
            self::FRONTEND . '/mon-espace/demandes/' . $this->leadId(),
            $this->renderAccepted(),
        );
    }

    public function test_the_acceptance_subject_names_the_vendor(): void
    {
        self::assertStringContainsString(self::VENDOR, (string) $this->captureAccepted()->getSubject());
    }

    // ── Refus ──────────────────────────────────────────────────────────────

    /**
     * Le cœur du ticket. Un refus laisse la fiche masquée côté couple
     * (PROVIDER-LEAD-005) : ni l'event, ni le contexte, ni l'objet, ni le HTML
     * ne peuvent nommer le prestataire.
     */
    public function test_the_refusal_never_names_the_vendor_anywhere(): void
    {
        $email = $this->captureRefused();

        $eventProperties = array_map(
            static fn(\ReflectionProperty $property) => strtolower($property->getName()),
            (new \ReflectionClass(ProviderLeadRefusedEvent::class))->getProperties(),
        );
        self::assertNotContains('vendorbrandname', $eventProperties);
        self::assertNotContains('vendorid', $eventProperties);

        foreach ($email->getContext() as $key => $value) {
            if (is_scalar($value)) {
                self::assertStringNotContainsStringIgnoringCase(self::VENDOR, (string) $value, sprintf(
                    'La clé de contexte « %s » ne doit pas porter le nom du prestataire.',
                    $key,
                ));
            }
        }

        self::assertStringNotContainsStringIgnoringCase(self::VENDOR, (string) $email->getSubject());
        self::assertStringNotContainsStringIgnoringCase(self::VENDOR, $this->renderRefused());
    }

    /**
     * Un seul motif générique dans cette version : le prestataire ne choisit
     * aucune raison, le couple ne lit donc aucune formulation qui jugerait son
     * projet.
     */
    public function test_the_refusal_carries_the_single_generic_reason(): void
    {
        $html = $this->renderRefused();

        self::assertStringContainsString('ne peut malheureusement pas donner suite', $html);
        self::assertStringContainsString('photographes', $html);
        self::assertStringContainsString(self::FRONTEND . '/wedream', $html);
    }

    /**
     * Une photo sans tag de métier laisse la catégorie nulle : la phrase doit
     * rester lisible, pas se terminer sur un blanc.
     */
    public function test_the_refusal_stays_readable_without_a_category(): void
    {
        $html = $this->renderRefused(category: null);

        self::assertStringContainsString('prestataires', $html);
        self::assertDoesNotMatchRegularExpression('/d\'autres\s*<strong[^>]*>\s*<\/strong>/', $html);
    }

    // ── Les deux ───────────────────────────────────────────────────────────

    /**
     * Un `{{ ... }}` survivant signifie une variable oubliée dans le contexte :
     * le couple recevrait l'accolade en clair.
     */
    public function test_no_twig_placeholder_survives_the_rendering(): void
    {
        self::assertDoesNotMatchRegularExpression('/\{\{.+?\}\}/', $this->renderAccepted());
        self::assertDoesNotMatchRegularExpression('/\{\{.+?\}\}/', $this->renderRefused());
    }

    /**
     * Les emails ne résolvent aucun chemin relatif, et le projet impose
     * Cloudinary comme unique hébergeur d'images — la maquette exportée portait
     * une URL de preview qui expire.
     */
    public function test_images_are_absolute_cloudinary_urls(): void
    {
        foreach ([$this->renderAccepted(), $this->renderRefused()] as $html) {
            preg_match_all('/<img[^>]+src="([^"]+)"/', $html, $matches);

            self::assertNotEmpty($matches[1], 'Aucune image trouvée dans le template.');

            foreach ($matches[1] as $src) {
                self::assertStringStartsWith('https://res.cloudinary.com/', $src);
            }
        }
    }

    /**
     * L'envoi ne doit jamais faire échouer la décision du prestataire, déjà
     * committée quand l'event part : un transport en panne se log, il ne remonte
     * pas — et il reste lisible sur Sentry.
     */
    public function test_a_failing_transport_never_escapes_either_listener(): void
    {
        self::bootKernel();

        $mailer = new class implements MailerInterface {
            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                throw new class extends \RuntimeException implements TransportExceptionInterface {
                    public function getDebug(): string
                    {
                        return '';
                    }

                    public function appendDebug(string $debug): void {}
                };
            }
        };

        $logger = new class extends AbstractLogger {
            /** @var string[] */
            public array $errors = [];

            public function log($level, \Stringable|string $message, array $context = []): void
            {
                if ($level === 'error') {
                    $this->errors[] = (string) $message;
                }
            }
        };

        // Aucun try/catch ici : si un listener laissait fuiter, le test échoue.
        (new CoupleLeadAcceptedEmailListener($mailer, self::FRONTEND, $logger))($this->acceptedEvent());
        (new CoupleLeadRefusedEmailListener($mailer, self::FRONTEND, $logger))($this->refusedEvent());

        self::assertCount(2, $logger->errors);
    }

    // ── Plomberie ──────────────────────────────────────────────────────────

    private function leadId(): string
    {
        return '0198f0a1-0000-7000-8000-000000000001';
    }

    private function acceptedEvent(): ProviderLeadAcceptedEvent
    {
        return new ProviderLeadAcceptedEvent(
            leadId:          $this->leadId(),
            coupleEmail:     'camille@example.test',
            coupleFirstName: 'Camille',
            vendorBrandName: self::VENDOR,
        );
    }

    private function refusedEvent(?string $category = 'Photographe'): ProviderLeadRefusedEvent
    {
        return new ProviderLeadRefusedEvent(
            leadId:          $this->leadId(),
            coupleEmail:     'camille@example.test',
            coupleFirstName: 'Camille',
            category:        $category,
        );
    }

    private function renderAccepted(): string
    {
        return $this->render($this->captureAccepted());
    }

    private function renderRefused(?string $category = 'Photographe'): string
    {
        return $this->render($this->captureRefused($category));
    }

    private function render(TemplatedEmail $email): string
    {
        /** @var Environment $twig */
        $twig = self::getContainer()->get(Environment::class);

        return $twig->render($email->getHtmlTemplate(), $email->getContext());
    }

    private function captureAccepted(): TemplatedEmail
    {
        $mailer = $this->recordingMailer();

        (new CoupleLeadAcceptedEmailListener($mailer, self::FRONTEND, new NullLogger()))(
            $this->acceptedEvent(),
        );

        return $mailer->sent ?? self::fail("Le listener d'acceptation n'a envoyé aucun email.");
    }

    private function captureRefused(?string $category = 'Photographe'): TemplatedEmail
    {
        $mailer = $this->recordingMailer();

        (new CoupleLeadRefusedEmailListener($mailer, self::FRONTEND, new NullLogger()))(
            $this->refusedEvent($category),
        );

        return $mailer->sent ?? self::fail("Le listener de refus n'a envoyé aucun email.");
    }

    private function recordingMailer(): MailerInterface
    {
        self::bootKernel();

        return new class implements MailerInterface {
            public ?TemplatedEmail $sent = null;

            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                $this->sent = $message;
            }
        };
    }
}
