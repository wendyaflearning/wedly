<?php

declare(strict_types=1);

namespace App\Tests\Functional\Admin;

use App\Entity\User\User;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Exception\EmailAlreadyUsedException;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * L'unicité de l'email vue depuis le côté prestataire (WED-162).
 *
 * `app_user` est une table unique et sans discriminant : couple et prestataire
 * partagent le même email unique. Ce test existe pour verrouiller le fait que
 * les deux côtés sortent bien avec le même statut et le même code machine — la
 * seule chose qui empêcherait un des deux de repartir en 500 le jour où
 * quelqu'un déplace le contrôle.
 *
 * Même dispositif transactionnel que `RegisterActionTest` : chaque test tourne
 * dans une transaction annulée en fin de test.
 */
final class CreateVendorActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/admin/vendors';

    private const TAKEN_EMAIL = 'studio@example.test';

    private KernelBrowser $client;
    private Connection $connection;
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->client->disableReboot();

        $this->em         = static::getContainer()->get(EntityManagerInterface::class);
        $this->jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);
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

    public function test_creating_a_vendor_on_a_taken_email_is_refused_with_the_shared_code(): void
    {
        $admin = $this->user('admin@example.test', Role::Admin);
        $this->user(self::TAKEN_EMAIL, Role::Couple);
        $this->em->flush();

        $before = $this->countUsers(self::TAKEN_EMAIL);

        $this->post($admin, $this->payload());

        self::assertResponseStatusCodeSame(409);
        self::assertSame(
            EmailAlreadyUsedException::CODE,
            $this->responseBody()['code'] ?? null,
            'Le côté prestataire doit sortir avec le même code que le côté couple.',
        );
        self::assertSame($before, $this->countUsers(self::TAKEN_EMAIL), 'Aucun compte ne doit avoir été créé.');
    }

    public function test_a_free_email_never_triggers_the_taken_email_refusal(): void
    {
        $admin = $this->user('admin@example.test', Role::Admin);
        $this->em->flush();

        $this->post($admin, $this->payload(email: 'libre@example.test'));

        // Le service du payload n'existe pas en base, donc la création échoue de
        // toute façon plus loin — et c'est sans importance ici. Ce que ce test
        // garde, c'est que l'échec n'est pas *celui-là* : un email libre ne doit
        // jamais ressortir en « email déjà utilisé ». Assert sur le refus qu'on
        // teste, pas sur le statut de l'échec suivant, qui n'est pas le sujet et
        // bougera avec le reste du parcours admin.
        self::assertNotSame(409, $this->client->getResponse()->getStatusCode());
        self::assertArrayNotHasKey('code', $this->responseBody());
    }

    private function post(User $admin, array $payload): void
    {
        $this->client->request(
            'POST',
            self::ENDPOINT,
            server: [
                'CONTENT_TYPE'       => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($admin),
            ],
            content: json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }

    /**
     * `service_id` et `regions` ne portent que des UUID bien formés : le contrôle
     * d'unicité de l'email est la toute première chose que fait
     * `AdminVendorDraftService::create()`, donc rien n'a besoin d'exister en base
     * pour que le cas testé se produise. Si ce test se met un jour à rendre 422
     * là où on attend 409, c'est que ce contrôle est passé derrière la
     * résolution des entités — et c'est une régression à voir.
     */
    private function payload(string $email = self::TAKEN_EMAIL): array
    {
        return [
            'firstname'  => 'Camille',
            'email'      => $email,
            'brand_name' => 'Studio Lumière',
            'service_id' => '0198f0a1-0000-7000-8000-0000000000aa',
            'regions'    => ['0198f0a1-0000-7000-8000-0000000000ab'],
            'price_type' => 'per_service',
            'price_min'  => 100_000,
            'price_max'  => 500_000,
        ];
    }

    private function user(string $email, Role $role): User
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail($email)
            ->setRoles([$role->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword('irrelevant-here');

        $this->em->persist($user);

        return $user;
    }

    /** @return array<string, mixed> */
    private function responseBody(): array
    {
        return json_decode(
            $this->client->getResponse()->getContent(),
            true,
            flags: JSON_THROW_ON_ERROR,
        );
    }

    private function countUsers(string $email): int
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM app_user WHERE email = ?',
            [$email],
        );
    }
}
