<?php

declare(strict_types=1);

namespace App\Tests\Functional\Couple;

use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
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
 * Épingler depuis Wedream une fois connecté (WED-155 / US3b). Ce qui se joue
 * ici tient en trois règles : le couple vient du JWT et de nulle part ailleurs,
 * une photo hors Wedream n'est jamais épinglable, et réépingler ne casse rien.
 */
final class CreateCouplePinActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/couples/me/pins';

    private const VENDOR_ID = '0198f0a1-0000-7000-8000-0000000000bb';

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

    public function test_a_couple_pins_a_wedream_photo(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(201);
        self::assertSame(1, $this->countPins($couple));
        self::assertSame($photo->getId(), $this->onlyPin($couple)->getPortfolioImage()->getId());
    }

    public function test_pinning_the_same_photo_twice_is_a_silent_no_op(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(201);

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseIsSuccessful();
        self::assertSame(1, $this->countPins($couple));
    }

    public function test_an_unknown_photo_is_rejected(): void
    {
        $couple = $this->couple('camille@example.test');
        $this->em->flush();

        $this->post($couple->getUser(), '0198f0a1-0000-7000-8000-00000000dead');

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countPins($couple));
    }

    public function test_a_photo_hidden_from_wedream_cannot_be_pinned(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor(), visibleInWedream: false);
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countPins($couple));
    }

    /**
     * WED-193 : le prestataire coupe sa vitrine Wedream entre le moment où le
     * couple voit la photo et le clic sur le cœur (fenêtre élargie par la file
     * locale, WED-160). L'épingle est refusé et aucune ligne `couple_pin`
     * n'est créée — la définition d'écriture rejoint celle de la lecture
     * (COUPLE-PIN-003).
     */
    public function test_a_photo_whose_vendor_left_wedream_cannot_be_pinned(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor();
        $photo  = $this->photo($vendor);
        $vendor->setWedreamEnabled(false);
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->countPins($couple));
    }

    public function test_a_couple_account_without_a_couple_profile_gets_a_404(): void
    {
        $user  = $this->user('camille@example.test', Role::Couple);
        $photo = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($user, $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(404);
    }

    public function test_a_vendor_account_cannot_pin(): void
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

    private function countPins(Couple $couple): int
    {
        return $this->em->getRepository(CouplePin::class)->count(['couple' => $couple]);
    }

    private function onlyPin(Couple $couple): CouplePin
    {
        return $this->em->getRepository(CouplePin::class)->findOneBy(['couple' => $couple]);
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
            ->setBudgetCents(2_350_000)
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

    private function photo(Vendor $vendor, bool $visibleInWedream = true): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl(sprintf(
                'https://res.cloudinary.com/wedly/image/upload/v1/wedly/vendors/%s/coup-de-coeur.jpg',
                self::VENDOR_ID,
            ))
            ->setSortOrder(0)
            ->setVisibleInWedream($visibleInWedream);

        $this->em->persist($photo);

        return $photo;
    }
}
