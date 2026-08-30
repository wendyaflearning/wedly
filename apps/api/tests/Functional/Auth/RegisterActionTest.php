<?php

declare(strict_types=1);

namespace App\Tests\Functional\Auth;

use App\Entity\Couple\Couple;
use App\Entity\User\User;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Premier test fonctionnel du projet. Il existe parce que le critère
 * d'acceptance du ticket est formulé au niveau HTTP (« doublon email → aucun
 * compte créé ») : c'est le seul niveau où le rollback de la transaction est
 * réellement vérifiable, un test unitaire ne fait que constater l'appel.
 *
 * Chaque test tourne dans une transaction annulée en fin de test : la base
 * `app_test` reste propre sans qu'on ait à supprimer quoi que ce soit.
 */
final class RegisterActionTest extends WebTestCase
{
    private KernelBrowser $client;
    private Connection $connection;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        // Sans cela, le noyau redémarre entre les requêtes et la transaction du
        // test serait perdue.
        $this->client->disableReboot();

        $this->em         = static::getContainer()->get(EntityManagerInterface::class);
        $this->connection = $this->em->getConnection();
        // DBAL 4 imbrique déjà les transactions via des savepoints : le commit
        // du service ne referme donc pas celle du test.
        $this->connection->beginTransaction();
    }

    protected function tearDown(): void
    {
        if ($this->connection->isTransactionActive()) {
            $this->connection->rollBack();
        }

        parent::tearDown();
    }

    public function test_a_complete_payload_creates_the_account_and_sets_the_jwt_cookie(): void
    {
        $this->post($this->payload());

        self::assertResponseStatusCodeSame(201);
        self::assertSame(
            ['firstName' => 'Camille'],
            json_decode($this->client->getResponse()->getContent(), true),
        );

        $cookie = $this->jwtCookie();
        self::assertNotNull($cookie, 'Le cookie jwt_token doit être posé.');
        self::assertTrue($cookie->isHttpOnly());

        $this->em->clear();

        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'camille@example.test']);
        self::assertInstanceOf(User::class, $user);
        self::assertContains('ROLE_COUPLE', $user->getRoles());

        $couple = $this->em->getRepository(Couple::class)->findOneBy(['user' => $user]);
        self::assertInstanceOf(Couple::class, $couple);

        $wedding = $couple->getWedding();
        self::assertInstanceOf(Wedding::class, $wedding);
        self::assertSame('Lyon', $wedding->getLocation());
        self::assertSame(2_350_000, $wedding->getBudgetCents());

        $consent = $this->em->getRepository(WeddingConsent::class)->findOneBy(['wedding' => $wedding]);
        self::assertInstanceOf(WeddingConsent::class, $consent);
        self::assertFalse($consent->isGranted());
    }

    public function test_a_duplicate_email_is_refused_and_creates_nothing(): void
    {
        $this->post($this->payload());
        self::assertResponseStatusCodeSame(201);

        $this->em->clear();
        $before = $this->countUsers();

        $this->post($this->payload(firstName: 'Alex'));

        self::assertResponseStatusCodeSame(409);
        self::assertSame($before, $this->countUsers(), 'Aucun compte ne doit avoir été créé.');
    }

    public function test_a_password_shorter_than_eight_characters_is_refused(): void
    {
        $this->post($this->payload(password: 'court'));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countUsers());
    }

    public function test_a_mismatched_password_confirmation_is_refused(): void
    {
        $payload                         = $this->payload();
        $payload['passwordConfirmation'] = 'autrechose';

        $this->post($payload);

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countUsers());
    }

    public function test_a_past_wedding_date_is_refused(): void
    {
        $this->post($this->payload(weddingDate: (new \DateTimeImmutable('yesterday'))->format('Y-m-d')));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countUsers());
    }

    public function test_a_budget_above_the_bound_is_refused(): void
    {
        $this->post($this->payload(budgetCents: 200_000_000));

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countUsers());
    }

    private function post(array $payload): void
    {
        $this->client->request(
            'POST',
            '/api/v1/register',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }

    private function payload(
        string $firstName = 'Camille',
        string $password = 'motdepasse',
        ?string $weddingDate = null,
        int $budgetCents = 2_350_000,
    ): array {
        return [
            'email'                => 'camille@example.test',
            'password'             => $password,
            'passwordConfirmation' => $password,
            'firstName'            => $firstName,
            'planningStage'        => 'just_started',
            'weddingDate'          => $weddingDate ?? (new \DateTimeImmutable('+1 year'))->format('Y-m-d'),
            'location'             => 'Lyon',
            'budgetCents'          => $budgetCents,
            'guestCount'           => 100,
            'sensitiveDataConsent' => false,
            'confessionSlugs'      => [],
            'cultureSlugs'         => [],
        ];
    }

    private function countUsers(): int
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM app_user WHERE email = ?',
            ['camille@example.test'],
        );
    }

    private function jwtCookie(): ?\Symfony\Component\HttpFoundation\Cookie
    {
        foreach ($this->client->getResponse()->headers->getCookies() as $cookie) {
            if ($cookie->getName() === 'jwt_token') {
                return $cookie;
            }
        }

        return null;
    }
}
