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
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Uid\UuidV7;

/**
 * Contacter un prestataire depuis Wedream une fois connecté (WED-156 / US3c).
 * Ce qui se joue ici tient en quatre règles : le couple vient du JWT et de nulle
 * part ailleurs, une photo hors Wedream ne permet de contacter personne,
 * recontacter le même prestataire ne crée pas un second lead, et le budget qui
 * qualifie la demande est celui du mariage — pas un montant envoyé par le
 * client.
 */
final class CreateCoupleProviderLeadActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/couples/me/provider-leads';

    private const VENDOR_ID = '0198f0a1-0000-7000-8000-0000000000bb';

    private const WEDDING_BUDGET_CENTS = 2_350_000;

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

    public function test_a_couple_contacts_a_vendor_from_a_wedream_photo(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor();
        $photo  = $this->photo($vendor);
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(201);
        self::assertSame(1, $this->countLeads($couple));

        $lead = $this->onlyLead($couple);
        self::assertSame($vendor->getId()->toRfc4122(), $lead->getVendor()->getId()->toRfc4122());
        self::assertSame($photo->getId()->toRfc4122(), $lead->getPortfolioImage()->getId()->toRfc4122());
    }

    /**
     * Le budget est lu dans le Wedding du couple connecté, pas dans le payload :
     * l'endpoint n'en accepte aucun. Un lead à 0 signifierait qu'on est reparti
     * d'un défaut au lieu du mariage réel.
     */
    public function test_the_lead_carries_the_wedding_budget(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(201);
        self::assertSame(self::WEDDING_BUDGET_CENTS, $this->onlyLead($couple)->getBudgetCents());
    }

    /**
     * Revenir sur le même prestataire depuis une autre photo est un geste
     * légitime côté couple : 200, aucun second lead, et la photo du premier
     * reste celle qui a déclenché la mise en relation.
     */
    public function test_contacting_the_same_vendor_from_another_photo_is_a_silent_no_op(): void
    {
        $couple      = $this->couple('camille@example.test');
        $vendor      = $this->vendor();
        $firstPhoto  = $this->photo($vendor);
        $secondPhoto = $this->photo($vendor, sortOrder: 1);
        $this->em->flush();

        $this->post($couple->getUser(), $firstPhoto->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(201);

        $this->post($couple->getUser(), $secondPhoto->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(200);
        self::assertSame(1, $this->countLeads($couple));
        self::assertSame(
            $firstPhoto->getId()->toRfc4122(),
            $this->onlyLead($couple)->getPortfolioImage()->getId()->toRfc4122(),
        );
    }

    public function test_an_unknown_photo_is_rejected(): void
    {
        $couple = $this->couple('camille@example.test');
        $this->em->flush();

        $this->post($couple->getUser(), '0198f0a1-0000-7000-8000-00000000dead');

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countLeads($couple));
    }

    public function test_a_photo_hidden_from_wedream_cannot_start_a_contact_request(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor(), visibleInWedream: false);
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countLeads($couple));
    }

    public function test_a_couple_account_without_a_couple_profile_gets_a_404(): void
    {
        $user  = $this->user('camille@example.test', Role::Couple);
        $photo = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($user, $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(404);
    }

    public function test_a_vendor_account_cannot_contact_a_vendor(): void
    {
        $vendor = $this->vendor();
        $photo  = $this->photo($vendor);
        $this->em->flush();

        $this->post($vendor->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(403);
    }

    public function test_an_anonymous_visitor_is_rejected(): void
    {
        $this->client->request(
            'POST',
            self::ENDPOINT,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['portfolioImageId' => '0198f0a1-0000-7000-8000-00000000dead'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
    }

    private function post(User $user, string $portfolioImageId): void
    {
        $this->client->request(
            'POST',
            self::ENDPOINT,
            server: [
                'CONTENT_TYPE'       => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($user),
            ],
            content: json_encode(['portfolioImageId' => $portfolioImageId], JSON_THROW_ON_ERROR),
        );
    }

    private function countLeads(Couple $couple): int
    {
        return $this->em->getRepository(ProviderLead::class)->count(['couple' => $couple]);
    }

    private function onlyLead(Couple $couple): ProviderLead
    {
        return $this->em->getRepository(ProviderLead::class)->findOneBy(['couple' => $couple]);
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

    private function couple(string $email): Couple
    {
        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('+1 year'))
            ->setLocation('Lyon')
            ->setBudgetCents(self::WEDDING_BUDGET_CENTS)
            ->setGuestCount(100);

        $couple = (new Couple())
            ->setUser($this->user($email, Role::Couple))
            ->setWedding($wedding)
            ->setPlanningStage(PlanningStage::JustStarted);

        $this->em->persist($wedding);
        $this->em->persist($couple);

        return $couple;
    }

    private function vendor(): Vendor
    {
        $vendor = (new Vendor())
            ->setUser($this->user('studio@example.test', Role::Vendor))
            ->setBrandName('Studio Lumière')
            ->setPhone('0600000000')
            ->setAddress('12 rue des Lilas')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100_000)
            ->setPriceMaxCents(500_000)
            ->setStatus(VendorStatus::Active)
            ->setIsPublished(true)
            ->setWedreamEnabled(true);

        $id = new \ReflectionProperty(Vendor::class, 'id');
        $id->setValue($vendor, UuidV7::fromString(self::VENDOR_ID));

        $this->em->persist($vendor);

        return $vendor;
    }

    private function photo(Vendor $vendor, bool $visibleInWedream = true, int $sortOrder = 0): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl(sprintf(
                'https://res.cloudinary.com/wedly/image/upload/v1/wedly/vendors/%s/coup-de-coeur-%d.jpg',
                self::VENDOR_ID,
                $sortOrder,
            ))
            ->setSortOrder($sortOrder)
            ->setVisibleInWedream($visibleInWedream);

        $this->em->persist($photo);

        return $photo;
    }
}
