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
 * Dé-épingler depuis Wedream (WED-183 / US3b). Ce qui se joue ici : le geste est
 * idempotent quel que soit l'état de départ, il désactive au lieu de supprimer,
 * et le réépinglage revient sur la même ligne — la contrainte unique interdit
 * d'en créer une seconde.
 */
final class DeleteCouplePinActionTest extends WebTestCase
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

    public function test_unpinning_an_active_pin_deactivates_it(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(201);

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(204);
        self::assertSame(1, $this->countPins($couple));
        self::assertFalse($this->onlyPin($couple)->isActive());
    }

    public function test_unpinning_twice_is_idempotent(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(204);

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(204);
        self::assertSame(1, $this->countPins($couple));
        self::assertFalse($this->onlyPin($couple)->isActive());
    }

    public function test_unpinning_a_photo_that_was_never_pinned_is_idempotent(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(204);
        self::assertSame(0, $this->countPins($couple));
    }

    /**
     * Le prestataire s'est retiré de Wedream après l'épinglage. Le pin sort déjà
     * des lectures (COUPLE-PIN-003), mais la ligne existe toujours : le couple
     * doit pouvoir la retirer, sinon son cœur reste bloqué en position remplie
     * pour une raison qui ne le concerne pas.
     */
    public function test_unpinning_works_even_if_the_vendor_left_wedream(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor();
        $photo  = $this->photo($vendor);
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(201);

        $vendor->setWedreamEnabled(false);
        $this->em->flush();

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(204);
        self::assertFalse($this->onlyPin($couple)->isActive());
    }

    /**
     * Même scénario par l'autre axe — la photo elle-même sort de Wedream — et
     * c'est ici que se lit la seule différence de comportement entre les deux
     * services : dans cet état exact épingler est refusé en 422, parce que
     * CreateCouplePinService passe par VendorResolver, alors que dé-épingler
     * passe quand même. C'est délibéré : retirer un coup de cœur ne dépend pas
     * de ce que le prestataire fait de sa galerie.
     */
    public function test_unpinning_works_even_if_the_photo_left_wedream(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(201);

        $photo->setVisibleInWedream(false);
        $this->em->flush();

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(204);
        self::assertFalse($this->onlyPin($couple)->isActive());

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(422);
    }

    public function test_pinning_again_revives_the_same_row(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        $pinId = $this->onlyPin($couple)->getId()->toRfc4122();

        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());
        $this->post($couple->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(201);
        self::assertSame(1, $this->countPins($couple));
        self::assertSame($pinId, $this->onlyPin($couple)->getId()->toRfc4122());
        self::assertTrue($this->onlyPin($couple)->isActive());
    }

    public function test_an_unpinned_photo_disappears_from_my_pins(): void
    {
        $couple = $this->couple('camille@example.test');
        $photo  = $this->photo($this->vendor());
        $this->em->flush();

        $this->post($couple->getUser(), $photo->getId()->toRfc4122());
        $this->delete($couple->getUser(), $photo->getId()->toRfc4122());

        $this->client->request(
            'GET',
            self::ENDPOINT,
            server: ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($couple->getUser())],
        );

        self::assertResponseIsSuccessful();
        self::assertSame([], json_decode($this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['items']);
    }

    public function test_a_couple_account_without_a_couple_profile_gets_a_404(): void
    {
        $user  = $this->user('camille@example.test', Role::Couple);
        $photo = $this->photo($this->vendor());
        $this->em->flush();

        $this->delete($user, $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(404);
    }

    public function test_a_vendor_account_cannot_unpin(): void
    {
        $vendor = $this->vendor();
        $photo  = $this->photo($vendor);
        $this->em->flush();

        $this->delete($vendor->getUser(), $photo->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(403);
    }

    public function test_an_anonymous_visitor_is_rejected(): void
    {
        $this->client->request('DELETE', self::ENDPOINT . '/0198f0a1-0000-7000-8000-00000000dead');

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

    private function delete(User $user, string $portfolioImageId): void
    {
        $this->client->request(
            'DELETE',
            self::ENDPOINT . '/' . $portfolioImageId,
            server: ['HTTP_AUTHORIZATION' => 'Bearer ' . $this->jwtManager->create($user)],
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
