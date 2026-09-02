<?php

declare(strict_types=1);

namespace App\Tests\Integration\Email;

use App\Event\ProviderLeadCreatedEvent;
use App\EventListener\VendorNewLeadNotificationEmailListener;
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
 * Rend réellement l'email de nouvelle demande, à partir du contexte que le
 * listener construit — pas d'un contexte réécrit à la main dans le test.
 *
 * C'est ce qui donne son sens à l'assertion RGPD : vérifier qu'un tableau écrit
 * dans le test ne contient pas de culture ne prouverait rien. Ici on capture le
 * `TemplatedEmail` réel et on regarde ce qui est effectivement transmis à Twig.
 */
final class VendorNewLeadNotificationTemplateTest extends KernelTestCase
{
    /**
     * Les clés que ni l'event, ni le contexte, ni le HTML ne doivent jamais
     * porter (RGPD Article 9) — réservées à WedMatch.
     */
    private const FORBIDDEN = ['culture', 'cultures', 'confession', 'confessions'];

    public function test_the_email_greets_the_vendor_and_names_the_couple(): void
    {
        $html = $this->render();

        self::assertMatchesRegularExpression(
            '/<p[^>]*class="[^"]*\bgreeting\b[^"]*"[^>]*>.*?Bonjour.*?Louis.*?<\/p>/s',
            $html,
        );
        self::assertStringContainsString('Camille', $html);
    }

    public function test_the_email_carries_the_whole_project_brief(): void
    {
        $html = $this->render();

        self::assertStringContainsString('12/06/2027', $html);
        self::assertStringContainsString('120', $html);
        self::assertStringContainsString('Photographe', $html);
        self::assertStringContainsString('Bohème', $html);
        self::assertStringContainsString('Champêtre', $html);
    }

    /**
     * Le budget est stocké en centimes et lu en euros : 2 350 000 centimes se
     * lisent « 23 500 € », jamais « 2350000 ».
     */
    public function test_the_budget_is_rendered_in_euros(): void
    {
        $html = $this->render();

        self::assertStringContainsString('23 500 €', $html);
        self::assertStringNotContainsString('2350000', $html);
    }

    /**
     * Le cœur du ticket. Culture et confession ne sont pas masquées ici, elles
     * sont absentes de la forme même de l'event — donc rien ne peut les faire
     * entrer dans le contexte Twig.
     */
    public function test_neither_the_event_nor_the_context_carries_culture_or_confession(): void
    {
        $eventProperties = array_map(
            static fn(\ReflectionProperty $property) => strtolower($property->getName()),
            (new \ReflectionClass(ProviderLeadCreatedEvent::class))->getProperties(),
        );

        foreach (self::FORBIDDEN as $forbidden) {
            self::assertNotContains($forbidden, $eventProperties, sprintf(
                'ProviderLeadCreatedEvent ne doit porter aucune propriété « %s ».',
                $forbidden,
            ));
        }

        $contextKeys = array_map('strtolower', array_keys($this->capture()->getContext()));

        foreach (self::FORBIDDEN as $forbidden) {
            self::assertNotContains($forbidden, $contextKeys, sprintf(
                'Le contexte Twig ne doit porter aucune clé « %s ».',
                $forbidden,
            ));
        }
    }

    /**
     * Un `{{ ... }}` survivant signifie une variable oubliée dans le contexte :
     * le prestataire recevrait l'accolade en clair.
     */
    public function test_no_twig_placeholder_survives_the_rendering(): void
    {
        self::assertDoesNotMatchRegularExpression('/\{\{.+?\}\}/', $this->render());
    }

    /**
     * Les emails ne résolvent aucun chemin relatif, et le projet impose
     * Cloudinary comme unique hébergeur d'images.
     */
    public function test_images_are_absolute_cloudinary_urls(): void
    {
        preg_match_all('/<img[^>]+src="([^"]+)"/', $this->render(), $matches);

        self::assertNotEmpty($matches[1], 'Aucune image trouvée dans le template.');

        foreach ($matches[1] as $src) {
            self::assertStringStartsWith('https://res.cloudinary.com/', $src);
        }
    }

    /**
     * Le mail ne doit jamais faire échouer la demande du couple, déjà committée
     * quand l'event part : un transport en panne se log, il ne remonte pas.
     */
    public function test_a_failing_transport_never_escapes_the_listener(): void
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

        $listener = new VendorNewLeadNotificationEmailListener(
            $mailer,
            'https://app.wedly-apps.test',
            $logger,
        );

        // Aucun try/catch ici : si le listener laissait fuiter, le test échoue.
        $listener($this->event());

        // Absorbé n'est pas ignoré — la panne doit rester lisible sur Sentry.
        self::assertCount(1, $logger->errors);
    }

    private function render(): string
    {
        $email = $this->capture();

        /** @var Environment $twig */
        $twig = self::getContainer()->get(Environment::class);

        return $twig->render($email->getHtmlTemplate(), $email->getContext());
    }

    /**
     * Fait tourner le vrai listener sur un mailer factice et retourne le
     * `TemplatedEmail` qu'il a construit.
     */
    private function capture(): TemplatedEmail
    {
        self::bootKernel();

        $mailer = new class implements MailerInterface {
            public ?TemplatedEmail $sent = null;

            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                $this->sent = $message;
            }
        };

        $listener = new VendorNewLeadNotificationEmailListener(
            $mailer,
            'https://app.wedly-apps.test',
            new NullLogger(),
        );

        $listener($this->event());

        self::assertInstanceOf(TemplatedEmail::class, $mailer->sent);

        return $mailer->sent;
    }

    private function event(): ProviderLeadCreatedEvent
    {
        return new ProviderLeadCreatedEvent(
            leadId:          '0198f0a1-0000-7000-8000-0000000000aa',
            vendorId:        '0198f0a1-0000-7000-8000-0000000000bb',
            vendorEmail:     'studio@example.test',
            vendorFirstName: 'Louis',
            coupleFirstName: 'Camille',
            weddingDate:     new \DateTimeImmutable('2027-06-12'),
            guestCount:      120,
            budgetCents:     2_350_000,
            category:        'Photographe',
            specialtyTags:   ['Bohème', 'Champêtre'],
        );
    }
}
