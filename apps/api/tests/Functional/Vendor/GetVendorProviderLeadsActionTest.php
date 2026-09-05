<?php

declare(strict_types=1);

namespace App\Tests\Functional\Vendor;

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
 * Les demandes reçues par le prestataire connecté (WED-51).
 *
 * Le critère d'acceptance est une règle de confidentialité — jamais les
 * coordonnées du couple tant que le prestataire n'a pas accepté, jamais culture
 * ni confession. Un test unitaire vérifie l'assembler ; celui-ci vérifie que la
 * réponse HTTP réelle, sérialisation et sécurité comprises, tient la même
 * promesse, et qu'un prestataire ne lit pas les demandes d'un autre.
 *
 * Chaque test tourne dans une transaction annulée en fin de test.
 */
final class GetVendorProviderLeadsActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/vendors/me/provider-leads';

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

    public function test_a_pending_lead_never_exposes_the_couple_contact_details(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $couple = $this->couple('camille@example.test');
        $this->lead($couple, $vendor, ProviderLeadStatus::Pending, $this->photo($vendor));
        $this->em->flush();

        $body = $this->get($vendor->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);

        $item = $body['items'][0];
        self::assertSame('pending', $item['status']);
        self::assertSame('Camille', $item['firstName']);

        foreach (['lastName', 'email', 'phone'] as $forbidden) {
            self::assertArrayNotHasKey($forbidden, $item);
        }

        $raw = json_encode($body, JSON_THROW_ON_ERROR);
        self::assertStringNotContainsString('Dupont', $raw);
        self::assertStringNotContainsString('camille@example.test', $raw);
        self::assertStringNotContainsString('0612345678', $raw);
    }

    public function test_an_accepted_lead_exposes_the_couple_contact_details(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $couple = $this->couple('camille@example.test');
        $this->lead($couple, $vendor, ProviderLeadStatus::Accepted, $this->photo($vendor));
        $this->em->flush();

        $item = $this->get($vendor->getUser())['items'][0];

        self::assertResponseIsSuccessful();
        self::assertSame('accepted', $item['status']);
        self::assertSame('Dupont', $item['lastName']);
        self::assertSame('camille@example.test', $item['email']);
        self::assertSame('0612345678', $item['phone']);
    }

    /**
     * L'exclusion RGPD (Article 9) ne dépend pas de la décision : ni avant, ni
     * après acceptation, ces données ne franchissent la frontière prestataire.
     */
    public function test_no_lead_ever_carries_culture_or_confession(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $this->lead($this->couple('camille@example.test'), $vendor, ProviderLeadStatus::Pending);
        $this->lead($this->couple('lea@example.test'), $vendor, ProviderLeadStatus::Accepted);
        $this->em->flush();

        $raw = strtolower(json_encode($this->get($vendor->getUser()), JSON_THROW_ON_ERROR));

        foreach (['culture', 'confession'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $raw);
        }
    }

    public function test_a_vendor_only_reads_its_own_leads(): void
    {
        $mine  = $this->vendor('studio@example.test');
        $other = $this->vendor('autre@example.test');

        $this->lead($this->couple('camille@example.test'), $mine, ProviderLeadStatus::Pending);
        $this->lead($this->couple('lea@example.test'), $other, ProviderLeadStatus::Pending);
        $this->em->flush();

        $body = $this->get($mine->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);
        self::assertStringNotContainsString('lea@example.test', json_encode($body, JSON_THROW_ON_ERROR));
    }

    public function test_the_project_brief_is_the_one_frozen_on_the_lead(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $couple = $this->couple('camille@example.test');
        $this->lead($couple, $vendor, ProviderLeadStatus::Pending);
        $this->em->flush();

        $item = $this->get($vendor->getUser())['items'][0];

        self::assertSame(2_350_000, $item['weddingBudgetCents']);
        self::assertSame(100, $item['guestCount']);
        self::assertArrayHasKey('weddingDate', $item);
        self::assertArrayHasKey('specialtyTags', $item);
    }

    public function test_a_couple_account_cannot_read_vendor_leads(): void
    {
        $couple = $this->couple('camille@example.test');
        $this->em->flush();

        $this->request($couple->getUser());

        self::assertResponseStatusCodeSame(403);
    }

    public function test_an_anonymous_visitor_is_rejected(): void
    {
        $this->client->request('GET', self::ENDPOINT);

        self::assertResponseStatusCodeSame(401);
    }

    /**
     * @return array<string, mixed>
     */
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
            ->setLastName('Dupont')
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
            ->setPlanningStage(PlanningStage::JustStarted)
            ->setPhone('0612345678');

        $this->em->persist($user);
        $this->em->persist($wedding);
        $this->em->persist($couple);

        return $couple;
    }

    private function vendor(string $email): Vendor
    {
        $user = (new User())
            ->setFirstName('Sacha')
            ->setEmail($email)
            ->setRoles([Role::Vendor->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword('irrelevant-here');

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Lumière')
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
