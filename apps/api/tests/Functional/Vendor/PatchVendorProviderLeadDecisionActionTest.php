<?php

declare(strict_types=1);

namespace App\Tests\Functional\Vendor;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
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
 * Le prestataire tranche une demande de mise en relation (WED-51).
 *
 * C'est le premier endroit du projet qui écrit `Accepted`/`Refused` : ce que ce
 * test protège, ce sont les trois refus — la demande d'un confrère, la
 * re-décision, et la valeur de décision inventée — plus le fait qu'accepter
 * dévoile réellement les coordonnées du couple.
 */
final class PatchVendorProviderLeadDecisionActionTest extends WebTestCase
{
    private const LEADS = '/api/v1/vendors/me/provider-leads';

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

    public function test_accepting_unlocks_the_couple_contact_details(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $lead   = $this->lead($this->couple('camille@example.test'), $vendor);
        $this->em->flush();

        $body = $this->decide($vendor->getUser(), $lead, 'accept');

        self::assertResponseIsSuccessful();
        self::assertSame('accepted', $body['status']);
        self::assertSame('camille@example.test', $body['email']);
        self::assertSame('0612345678', $body['phone']);
        self::assertSame('Dupont', $body['lastName']);

        self::assertSame(ProviderLeadStatus::Accepted->value, $this->persistedStatusOf($lead));
    }

    /**
     * Le pendant du GET : ce que l'écran relira après avoir accepté.
     */
    public function test_the_next_read_returns_the_unlocked_lead(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $lead   = $this->lead($this->couple('camille@example.test'), $vendor);
        $this->em->flush();

        $this->decide($vendor->getUser(), $lead, 'accept');

        $this->client->request(
            'GET',
            self::LEADS,
            server: ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($vendor->getUser())],
        );

        $item = json_decode($this->client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR)['items'][0];

        self::assertSame('accepted', $item['status']);
        self::assertSame('camille@example.test', $item['email']);
    }

    public function test_refusing_leaves_the_lead_masked(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $lead   = $this->lead($this->couple('camille@example.test'), $vendor);
        $this->em->flush();

        $body = $this->decide($vendor->getUser(), $lead, 'refuse');

        self::assertResponseIsSuccessful();
        self::assertSame('refused', $body['status']);
        self::assertArrayNotHasKey('email', $body);
        self::assertArrayNotHasKey('phone', $body);

        self::assertSame(ProviderLeadStatus::Refused->value, $this->persistedStatusOf($lead));
    }

    /**
     * Un 403 distinct confirmerait l'existence de la demande d'un confrère.
     */
    public function test_deciding_another_vendors_lead_is_a_404(): void
    {
        $mine  = $this->vendor('studio@example.test');
        $other = $this->vendor('autre@example.test');
        $lead  = $this->lead($this->couple('lea@example.test'), $other);
        $this->em->flush();

        $this->decide($mine->getUser(), $lead, 'accept');

        self::assertResponseStatusCodeSame(404);

        self::assertSame(ProviderLeadStatus::Pending->value, $this->persistedStatusOf($lead));
    }

    public function test_deciding_twice_is_a_409(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $lead   = $this->lead($this->couple('camille@example.test'), $vendor);
        $this->em->flush();

        $this->decide($vendor->getUser(), $lead, 'refuse');
        self::assertResponseIsSuccessful();

        $this->decide($vendor->getUser(), $lead, 'accept');

        self::assertResponseStatusCodeSame(409);

        // Le refus tient : une re-décision refusée ne doit rien avoir réécrit.
        self::assertSame(ProviderLeadStatus::Refused->value, $this->persistedStatusOf($lead));
    }

    public function test_an_unknown_lead_is_a_404(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $this->em->flush();

        $this->request($vendor->getUser(), '0198f0a1-0000-7000-8000-0000000000ff', 'accept');

        self::assertResponseStatusCodeSame(404);
    }

    public function test_a_malformed_lead_id_is_a_404_not_a_crash(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $this->em->flush();

        $this->request($vendor->getUser(), 'pas-un-uuid', 'accept');

        self::assertResponseStatusCodeSame(404);
    }

    /**
     * Le champ est typé par l'enum : une décision inventée est refusée avant
     * même que le service voie la demande.
     */
    public function test_an_unknown_decision_is_refused(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $lead   = $this->lead($this->couple('camille@example.test'), $vendor);
        $this->em->flush();

        $this->decide($vendor->getUser(), $lead, 'peut-etre');

        self::assertResponseStatusCodeSame(422);

        self::assertSame(ProviderLeadStatus::Pending->value, $this->persistedStatusOf($lead));
    }

    public function test_a_couple_account_cannot_decide(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $couple = $this->couple('camille@example.test');
        $lead   = $this->lead($couple, $vendor);
        $this->em->flush();

        // `request()` et pas `decide()` : un 403 de sécurité ne renvoie pas de
        // corps JSON à décoder.
        $this->request($couple->getUser(), $lead->getId()->toRfc4122(), 'accept');

        self::assertResponseStatusCodeSame(403);
    }

    public function test_an_anonymous_visitor_is_rejected(): void
    {
        $this->client->request(
            'PATCH',
            self::LEADS . '/0198f0a1-0000-7000-8000-0000000000ff',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['decision' => 'accept'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
    }

    /**
     * Relit le statut réellement écrit en base plutôt que l'entité en mémoire :
     * l'identity map du test porte encore la valeur d'avant la requête HTTP.
     */
    private function persistedStatusOf(ProviderLead $lead): string
    {
        return $this->connection->fetchOne(
            'SELECT status FROM provider_lead WHERE id = :id',
            ['id' => $lead->getId()->toRfc4122()],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function decide(User $user, ProviderLead $lead, string $decision): array
    {
        $this->request($user, $lead->getId()->toRfc4122(), $decision);

        return json_decode($this->client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
    }

    private function request(User $user, string $leadId, string $decision): void
    {
        $this->client->request(
            'PATCH',
            self::LEADS . '/' . $leadId,
            server: [
                'CONTENT_TYPE'       => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($user),
            ],
            content: json_encode(['decision' => $decision], JSON_THROW_ON_ERROR),
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

    private function lead(Couple $couple, Vendor $vendor): ProviderLead
    {
        $lead = new ProviderLead($couple, $vendor, 2_350_000);

        $this->em->persist($lead);

        return $lead;
    }
}
