<?php

declare(strict_types=1);

namespace App\Tests\Integration\Email;

use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Twig\Environment;

/**
 * Rend réellement le template de lancement WedDream.
 *
 * Les tests de VendorWeddreamLaunchEmailService mockent le Mailer et vérifient le
 * contexte *passé* à TemplatedEmail — jamais le HTML produit. Un template peut donc
 * cesser d'utiliser une variable sans qu'aucun test ne bronche : c'est exactement
 * comme ça que la personnalisation (firstName, brandName) a disparu en silence lors
 * de la refonte, et comment la maquette a failli figer un libellé de CTA qui doit
 * rester dynamique. Ce test ferme cette classe de régression.
 */
final class VendorWeddreamLaunchTemplateTest extends KernelTestCase
{
    private const TEMPLATE = 'emails/vendor/vendor_weddream_launch.html.twig';

    private const CONTEXT = [
        'firstName'      => 'Camille',
        'brandName'      => 'Atelier Lumière',
        'ctaLabel'       => 'Rejoindre Wedly',
        'ctaUrl'         => 'https://app.wedly-apps.test/onboarding/tok-123',
        'consentFormUrl' => 'https://tally.so/r/xX5okd?prestataire_id=vendor-123',
        'unsubscribeUrl' => 'https://app.wedly-apps.test/unsubscribe/vendor-123',
    ];

    public function test_the_email_greets_the_vendor_by_first_name(): void
    {
        // On cible le bloc de salut plutôt que le HTML entier : une occurrence du prénom
        // ailleurs dans la page ne doit pas suffire à faire passer ce test.
        self::assertMatchesRegularExpression(
            '/<p[^>]*class="[^"]*\bgreeting\b[^"]*"[^>]*>.*?Bonjour.*?Camille.*?<\/p>/s',
            $this->render(),
        );
    }

    public function test_the_email_names_the_brand(): void
    {
        $html = $this->render();

        // Deux mentions attendues : section « Salon du Mariage » et carte de consentement.
        self::assertSame(2, substr_count($html, 'Atelier Lumière'));
    }

    /**
     * Le libellé du CTA est calculé par le service selon le statut du prestataire.
     * La maquette le figeait en dur sur « Accéder à mon espace », ce qui aurait envoyé
     * ce texte à des prestataires qui n'ont pas encore de compte.
     */
    public function test_the_cta_label_stays_dynamic(): void
    {
        $html = $this->render();

        self::assertStringContainsString('Rejoindre Wedly', $html);
        self::assertStringNotContainsString('Accéder à mon espace', $html);
    }

    public function test_every_url_of_the_context_is_rendered(): void
    {
        $html = $this->render();

        foreach (['ctaUrl', 'consentFormUrl', 'unsubscribeUrl'] as $key) {
            self::assertStringContainsString(self::CONTEXT[$key], $html, sprintf('URL manquante : %s', $key));
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
     * Les emails ne peuvent pas résoudre de chemin relatif : toute image doit être
     * une URL absolue, et le projet impose Cloudinary comme unique hébergeur.
     */
    public function test_images_are_absolute_cloudinary_urls(): void
    {
        preg_match_all('/<img[^>]+src="([^"]+)"/', $this->render(), $matches);

        self::assertNotEmpty($matches[1], 'Aucune image trouvée dans le template.');

        foreach ($matches[1] as $src) {
            self::assertStringStartsWith('https://res.cloudinary.com/', $src);
        }
    }

    private function render(): string
    {
        self::bootKernel();

        /** @var Environment $twig */
        $twig = self::getContainer()->get(Environment::class);

        return $twig->render(self::TEMPLATE, self::CONTEXT);
    }
}
