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
 * The acceptance criterion is a privacy rule — « no vendor data, only the image ».
 * A unit test covers the assembler; this one checks the real HTTP response,
 * serialization and security included, and that a couple cannot read another
 * couple's pins.
 */
final class GetCouplePinsActionTest extends WebTestCase
{
    private const ENDPOINT = '/api/v1/couples/me/pins';

    private const VENDOR_ID = '0198f0a1-0000-7000-8000-0000000000aa';

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

    public function test_a_couple_reads_its_pins_without_any_vendor_identity(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $photo  = $this->photo($vendor);
        $this->pin($couple, $photo);
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);

        $item = $body['items'][0];
        self::assertSame($this->cloudinaryUrl('coup-de-coeur.jpg'), $item['photoUrl']);
        self::assertSame($photo->getId()->toRfc4122(), $item['portfolioImageId']);
        self::assertArrayHasKey('pinnedAt', $item);
        self::assertArrayHasKey('id', $item);
        self::assertStringNotContainsString('Studio Lumière', json_encode($body, JSON_THROW_ON_ERROR));
        self::assertStringNotContainsString('studio@example.test', json_encode($body, JSON_THROW_ON_ERROR));
    }

    public function test_pins_are_returned_most_recent_first_even_when_created_in_the_same_second(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');

        $first  = $this->pin($couple, $this->photo($vendor, $this->cloudinaryUrl('first.jpg')));
        $second = $this->pin($couple, $this->photo($vendor, $this->cloudinaryUrl('second.jpg')));
        $third  = $this->pin($couple, $this->photo($vendor, $this->cloudinaryUrl('third.jpg')));
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertSame(
            [
                $third->getId()->toRfc4122(),
                $second->getId()->toRfc4122(),
                $first->getId()->toRfc4122(),
            ],
            array_column($body['items'], 'id'),
        );
    }

    public function test_a_vendor_wedream_opt_out_hides_the_pin_from_the_couple(): void
    {
        $couple = $this->couple('camille@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $this->pin($couple, $this->photo($vendor));
        $vendor->setWedreamEnabled(false);
        $this->em->flush();

        $body = $this->get($couple->getUser());

        self::assertResponseIsSuccessful();
        self::assertSame([], $body['items']);
    }

    public function test_a_couple_only_reads_its_own_pins(): void
    {
        $mine   = $this->couple('camille@example.test');
        $theirs = $this->couple('alex@example.test');
        $vendor = $this->vendor('studio@example.test', 'Studio Lumière');
        $photo  = $this->photo($vendor);
        $this->pin($mine, $photo);
        $this->pin($theirs, $this->photo($vendor, $this->cloudinaryUrl('other.jpg')));
        $this->em->flush();

        $body = $this->get($mine->getUser());

        self::assertResponseIsSuccessful();
        self::assertCount(1, $body['items']);
        self::assertSame($this->cloudinaryUrl('coup-de-coeur.jpg'), $body['items'][0]['photoUrl']);
    }

    public function test_a_couple_without_any_pin_gets_an_empty_list(): void
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

    private function cloudinaryUrl(string $filename): string
    {
        return sprintf(
            'https://res.cloudinary.com/wedly/image/upload/v1/wedly/vendors/%s/%s',
            self::VENDOR_ID,
            $filename,
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

        $id = new \ReflectionProperty(Vendor::class, 'id');
        $id->setValue($vendor, UuidV7::fromString(self::VENDOR_ID));

        $this->em->persist($user);
        $this->em->persist($vendor);

        return $vendor;
    }

    private function photo(Vendor $vendor, ?string $url = null): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl($url ?? $this->cloudinaryUrl('coup-de-coeur.jpg'))
            ->setSortOrder(0)
            ->setVisibleInWedream(true);

        $this->em->persist($photo);

        return $photo;
    }

    private function pin(Couple $couple, PortfolioImage $photo): CouplePin
    {
        $pin = new CouplePin($couple, $photo);
        $this->em->persist($pin);

        return $pin;
    }
}
