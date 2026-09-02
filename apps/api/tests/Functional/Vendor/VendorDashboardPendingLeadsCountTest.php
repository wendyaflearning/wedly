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
 * Le badge « demandes en attente » du dashboard prestataire (WED-51).
 *
 * Pas de nouvelle route : le compteur voyage avec le dashboard existant, et il
 * se rafraîchit à la connexion — aucun temps réel n'est promis au prestataire.
 * Ce test ne couvre que ce champ ; le reste du dashboard est couvert ailleurs.
 */
final class VendorDashboardPendingLeadsCountTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/vendors/me/dashboard';

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

    public function test_a_vendor_without_any_lead_sees_zero(): void
    {
        $vendor = $this->vendor('studio@example.test');
        $this->em->flush();

        $body = $this->dashboard($vendor->getUser());

        self::assertResponseIsSuccessful();
        self::assertArrayHasKey('pendingLeadsCount', $body);
        self::assertSame(0, $body['pendingLeadsCount']);
    }

    /**
     * Le badge compte ce qui attend une décision, pas ce qui a été reçu : une
     * demande déjà acceptée ou refusée n'a plus rien à réclamer.
     */
    public function test_only_pending_leads_are_counted(): void
    {
        $vendor = $this->vendor('studio@example.test');

        $this->lead($this->couple('camille@example.test'), $vendor, ProviderLeadStatus::Pending);
        $this->lead($this->couple('lea@example.test'), $vendor, ProviderLeadStatus::Pending);
        $this->lead($this->couple('noa@example.test'), $vendor, ProviderLeadStatus::Accepted);
        $this->lead($this->couple('sam@example.test'), $vendor, ProviderLeadStatus::Refused);
        $this->em->flush();

        self::assertSame(2, $this->dashboard($vendor->getUser())['pendingLeadsCount']);
    }

    public function test_another_vendors_leads_are_not_counted(): void
    {
        $mine  = $this->vendor('studio@example.test');
        $other = $this->vendor('autre@example.test');

        $this->lead($this->couple('camille@example.test'), $mine, ProviderLeadStatus::Pending);
        $this->lead($this->couple('lea@example.test'), $other, ProviderLeadStatus::Pending);
        $this->lead($this->couple('noa@example.test'), $other, ProviderLeadStatus::Pending);
        $this->em->flush();

        self::assertSame(1, $this->dashboard($mine->getUser())['pendingLeadsCount']);
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboard(User $user): array
    {
        $this->client->request(
            'GET',
            self::ENDPOINT,
            server: ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($user)],
        );

        return json_decode($this->client->getResponse()->getContent(), true, flags: JSON_THROW_ON_ERROR);
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

    private function lead(Couple $couple, Vendor $vendor, ProviderLeadStatus $status): ProviderLead
    {
        $lead = (new ProviderLead($couple, $vendor, 2_350_000))->setStatus($status);

        $this->em->persist($lead);

        return $lead;
    }
}
