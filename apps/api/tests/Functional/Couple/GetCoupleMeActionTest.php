<?php

declare(strict_types=1);

namespace App\Tests\Functional\Couple;

use App\Entity\Couple\Couple;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\PlanningStage;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class GetCoupleMeActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/couples/me';

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

    public function test_a_couple_reads_its_session_profile(): void
    {
        $couple = $this->couple('camille@example.test');
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertSame($couple->getId()->toRfc4122(), $body['id']);
        self::assertSame('Camille', $body['firstName']);
        self::assertSame('camille@example.test', $body['email']);
    }

    public function test_a_vendor_account_cannot_read_the_couple_session(): void
    {
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $this->em->flush();

        $this->request($vendor->getUser());

        self::assertResponseStatusCodeSame(403);
    }

    public function test_an_anonymous_visitor_is_rejected(): void
    {
        $this->client->request('GET', self::ENDPOINT);

        self::assertResponseStatusCodeSame(401);
    }

    private function get(User $user): array
    {
        $this->request($user);

        return json_decode($this->client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
    }

    private function request(User $user): void
    {
        $this->client->request(
            'GET',
            self::ENDPOINT,
            server: ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($user)],
        );
    }

    private function couple(string $email): Couple
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail($email)
            ->setRoles([Role::Couple->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword('irrelevant-here');

        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('+1 year'))
            ->setLocation('Lyon')
            ->setBudgetCents(2_350_000)
            ->setGuestCount(100);

        $couple = (new Couple())
            ->setUser($user)
            ->setWedding($wedding)
            ->setPlanningStage(PlanningStage::JustStarted);

        $this->em->persist($user);
        $this->em->persist($wedding);
        $this->em->persist($couple);

        return $couple;
    }

    private function vendor(string $email, string $brandName): Vendor
    {
        $user = (new User())
            ->setFirstName('Sacha')
            ->setEmail($email)
            ->setRoles([Role::Vendor->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword('irrelevant-here');

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName($brandName)
            ->setPhone('0600000000')
            ->setAddress('12 rue des Lilas')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100_000)
            ->setPriceMaxCents(500_000)
            ->setStatus(VendorStatus::Active)
            ->setIsPublished(true)
            ->setWedreamEnabled(true);

        $this->em->persist($user);
        $this->em->persist($vendor);

        return $vendor;
    }
}
