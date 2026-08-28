<?php

declare(strict_types=1);

namespace App\Tests\Functional\Couple;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\PlanningStage;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Le critère d'acceptance du ticket est une règle de confidentialité — « jamais
 * nom/coordonnées vendor tant que le prestataire n'a pas accepté ». Un test
 * unitaire vérifie l'assembler ; celui-ci vérifie que la réponse HTTP réelle,
 * sérialisation et sécurité comprises, tient la même promesse, et qu'un couple
 * ne peut pas lire les demandes d'un autre.
 *
 * Chaque test tourne dans une transaction annulée en fin de test, comme
 * `RegisterActionTest`.
 */
final class GetCoupleProviderLeadsActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/couples/me/provider-leads';

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

    public function test_a_pending_lead_never_exposes_the_vendor_identity(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $this->lead($couple, $vendor, ProviderLeadStatus::Pending, $this->photo($vendor));
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);

        $item = $body['items'][0];
        self::assertSame('EN_ATTENTE', $item['status']);
        self::assertArrayNotHasKey('vendor', $item);
        self::assertStringNotContainsString('Studio Lumière', json_encode($body, JSON_THROW_ON_ERROR));
        self::assertStringNotContainsString('studio@example.test', json_encode($body, JSON_THROW_ON_ERROR));
        self::assertSame('https://cdn.wedly.test/coup-de-coeur.jpg', $item['photoUrl']);
    }

    public function test_an_accepted_lead_exposes_the_profile_and_the_contact_details(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $this->lead($couple, $vendor, ProviderLeadStatus::Accepted, $this->photo($vendor));
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        $item = $body['items'][0];
        self::assertSame('DEBLOQUEE', $item['status']);
        self::assertSame('Studio Lumière', $item['vendor']['brandName']);
        self::assertSame('studio@example.test', $item['vendor']['contact']['email']);
        self::assertSame('0600000000', $item['vendor']['contact']['phone']);
    }

    public function test_a_couple_only_reads_its_own_requests(): void
    {
        $mine     = $this->couple('camille@example.test');
        $theirs   = $this->couple('alex@example.test');
        $vendor   = $this->vendor('studio@example.test', 'Studio Lumière');
        $this->lead($mine, $vendor, ProviderLeadStatus::Pending);
        $this->lead($theirs, $vendor, ProviderLeadStatus::Accepted);
        $this->em->flush();

        $body = $this->get($mine->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);
        self::assertSame('EN_ATTENTE', $body['items'][0]['status']);
    }

    public function test_a_couple_without_any_request_gets_an_empty_list(): void
    {
        $couple = $this->couple('camille@example.test');
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertSame([], $body['items']);
    }

    public function test_a_vendor_account_cannot_read_the_couple_area(): void
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
            ->setPriceMaxCents(500_000);

        $this->em->persist($user);
        $this->em->persist($vendor);

        return $vendor;
    }

    private function photo(Vendor $vendor): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/coup-de-coeur.jpg')
            ->setSortOrder(0);

        $this->em->persist($photo);

        return $photo;
    }

    private function lead(
        Couple $couple,
        Vendor $vendor,
        ProviderLeadStatus $status,
        ?PortfolioImage $photo = null,
    ): ProviderLead {
        $lead = (new ProviderLead($couple, $vendor, 2_350_000, $photo))->setStatus($status);

        $this->em->persist($lead);

        return $lead;
    }
}
