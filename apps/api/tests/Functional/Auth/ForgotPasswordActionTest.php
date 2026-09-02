<?php

declare(strict_types=1);

namespace App\Tests\Functional\Auth;

use App\Entity\User\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Mime\Address;

/**
 * Garde-fou WED-167 (F1) : le lien de réinitialisation ne doit jamais partir
 * ailleurs que sur l'adresse du compte concerné. Le destinataire avait été
 * détourné vers la boîte interne sans que rien ne le signale — ce test rend la
 * régression impossible à repasser silencieusement.
 *
 * Le test est fonctionnel et non unitaire parce que le destinataire n'est
 * observable qu'une fois l'email réellement dispatché par le mailer.
 *
 * Même protocole que RegisterActionTest : transaction ouverte au setUp,
 * annulée au tearDown, la base `app_test` reste propre.
 */
final class ForgotPasswordActionTest extends WebTestCase
{
    private const USER_EMAIL = 'lea@example.test';

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
        $this->connection->beginTransaction();
    }

    protected function tearDown(): void
    {
        if ($this->connection->isTransactionActive()) {
            $this->connection->rollBack();
        }

        parent::tearDown();
    }

    public function test_the_reset_link_is_sent_to_the_account_owner(): void
    {
        $this->createUser();

        $this->client->request(
            'POST',
            '/api/v1/auth/forgot-password',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => self::USER_EMAIL], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
        self::assertEmailCount(1);

        $recipients = array_map(
            static fn (Address $address): string => $address->getAddress(),
            self::getMailerMessage()->getTo(),
        );

        self::assertSame(
            [self::USER_EMAIL],
            $recipients,
            'Le lien de réinitialisation doit partir sur la seule adresse du compte.',
        );
    }

    private function createUser(): void
    {
        $user = (new User())
            ->setEmail(self::USER_EMAIL)
            ->setFirstName('Léa')
            // Le hash n'est jamais relu par ce parcours : il n'a qu'à satisfaire
            // la colonne non nullable.
            ->setPassword('$2y$13$notarealhashjustaplaceholder')
            ->setRoles(['ROLE_COUPLE']);

        $this->em->persist($user);
        $this->em->flush();
    }
}
