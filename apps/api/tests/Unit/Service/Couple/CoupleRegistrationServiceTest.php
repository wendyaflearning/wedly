<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Couple;

use App\DTO\Couple\ProviderContactRequestDto;
use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use App\Enum\Couple\PlanningStage;
use App\Enum\ProviderLead\ProviderLeadOrigin;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use App\Service\Couple\CoupleRegistrationService;
use Doctrine\DBAL\Driver\Exception as DriverException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\UuidV7;

final class CoupleRegistrationServiceTest extends TestCase
{
    /** @var object[] */
    private array $persisted = [];

    public function test_it_persists_the_four_entities_in_one_transaction(): void
    {
        $em = $this->makeEntityManager(strict: true);
        $em->expects($this->once())->method('beginTransaction');
        $em->expects($this->once())->method('flush');
        $em->expects($this->once())->method('commit');
        $em->expects($this->never())->method('rollback');

        $user = $this->makeService($em)->register($this->makeDto());

        // getRoles() ajoute ROLE_USER, c'est le comportement standard de Symfony.
        self::assertContains(Role::Couple->value, $user->getRoles());
        self::assertSame(UserStatus::Active, $user->getStatus());
        self::assertSame('hashed:motdepasse', $user->getPassword());

        self::assertCount(4, $this->persisted);
        self::assertInstanceOf(User::class, $this->persisted[0]);
        self::assertInstanceOf(Wedding::class, $this->persisted[1]);
        self::assertInstanceOf(Couple::class, $this->persisted[2]);
        self::assertInstanceOf(WeddingConsent::class, $this->persisted[3]);
    }

    public function test_it_carries_the_wedding_profile_and_leaves_wedmatch_fields_null(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto());

        $wedding = $this->persistedOf(Wedding::class);

        self::assertSame('Lyon', $wedding->getLocation());
        self::assertSame(2_350_000, $wedding->getBudgetCents());
        self::assertSame(100, $wedding->getGuestCount());
        // COUPLE-ONBOARDING-003 : aucun écran ne les renseigne.
        self::assertNull($wedding->getZone());
        self::assertNull($wedding->getAmbiance());
        self::assertNull($wedding->getCeremonyType());
    }

    public function test_it_trims_the_first_name_and_the_location(): void
    {
        $this->makeService($this->makeEntityManager())
            ->register($this->makeDto(firstName: '  Camille  ', location: '  Lyon '));

        self::assertSame('Camille', $this->persistedOf(User::class)->getFirstName());
        self::assertSame('Lyon', $this->persistedOf(Wedding::class)->getLocation());
    }

    public function test_a_taken_email_is_refused_without_writing_anything(): void
    {
        $em = $this->makeEntityManager(strict: true);
        $em->expects($this->never())->method('persist');
        $em->expects($this->never())->method('beginTransaction');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        $this->makeService($em, emailTaken: true)->register($this->makeDto());
    }

    public function test_granted_consent_resolves_the_slugs(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto(
            sensitiveDataConsent: true,
            confessionSlugs: ['catholique'],
            cultureSlugs: ['europe'],
        ));

        $wedding = $this->persistedOf(Wedding::class);

        self::assertCount(1, $wedding->getConfessions());
        self::assertCount(1, $wedding->getCultures());
        self::assertTrue($this->persistedOf(WeddingConsent::class)->isGranted());
    }

    public function test_a_refusal_ignores_slugs_the_client_still_sent(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto(
            sensitiveDataConsent: false,
            confessionSlugs: ['catholique'],
            cultureSlugs: ['europe'],
        ));

        $wedding = $this->persistedOf(Wedding::class);

        self::assertCount(0, $wedding->getConfessions());
        self::assertCount(0, $wedding->getCultures());
        self::assertFalse($this->persistedOf(WeddingConsent::class)->isGranted());
    }

    public function test_an_unknown_slug_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager())->register($this->makeDto(
            sensitiveDataConsent: true,
            confessionSlugs: ['inexistante'],
        ));
    }

    public function test_without_a_contact_request_no_lead_is_created(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto());

        self::assertSame([], array_filter($this->persisted, static fn($e) => $e instanceof ProviderLead));
    }

    public function test_a_contact_request_creates_a_pending_lead(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto(
            contactRequest: new ProviderContactRequestDto(self::VENDOR_ID),
        ));

        $lead = $this->persistedOf(ProviderLead::class);

        self::assertSame(ProviderLeadStatus::Pending, $lead->getStatus());
        self::assertSame(ProviderLeadOrigin::Wedream, $lead->getOrigin());
        // PROVIDER-LEAD-002 : le lead porte sa propre copie du budget global.
        self::assertSame(2_350_000, $lead->getBudgetCents());
    }

    public function test_an_inactive_vendor_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(vendorStatus: VendorStatus::Pending))->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID)),
        );
    }

    public function test_an_unknown_vendor_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(vendorStatus: null))->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID)),
        );
    }

    public function test_an_unknown_crush_photo_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager())->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)),
        );
    }

    public function test_a_crush_photo_from_another_vendor_is_refused(): void
    {
        $otherVendor = $this->createStub(Vendor::class);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($otherVendor),
        ))->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)),
        );
    }

    public function test_a_crush_photo_not_visible_in_wedream_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($vendor, visibleInWedream: false),
        ))->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)),
        );
    }

    public function test_a_failing_flush_rolls_the_transaction_back(): void
    {
        $em = $this->makeEntityManager(strict: true);
        $em->method('flush')->willThrowException(new \RuntimeException('boom'));
        $em->expects($this->once())->method('rollback');
        $em->expects($this->never())->method('commit');

        $this->expectException(\RuntimeException::class);

        $this->makeService($em)->register($this->makeDto());
    }

    /**
     * Le contrôle préalable sur l'email ne ferme pas la fenêtre de course : deux
     * inscriptions simultanées peuvent le franchir avant qu'aucune n'ait
     * committé. La violation d'unicité qui en résulte doit répondre le même 409
     * que le chemin nominal, pas un 500 non mappé par l'ExceptionListener.
     */
    public function test_a_concurrent_duplicate_email_answers_409_rather_than_500(): void
    {
        $em = $this->makeEntityManager(strict: true);
        $em->method('flush')->willThrowException(
            new UniqueConstraintViolationException($this->createStub(DriverException::class), null),
        );
        $em->expects($this->once())->method('rollback');
        $em->expects($this->never())->method('commit');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        $this->makeService($em)->register($this->makeDto());
    }

    private const VENDOR_ID = '0198f1c2-0000-7000-8000-000000000000';
    private const CRUSH_PHOTO_ID = '0198f1c2-0000-7000-8000-000000000001';

    /**
     * PHPUnit 12 signale un mock sans attente : les tests qui se contentent
     * d'inspecter les entités persistées reçoivent donc un stub, et seuls ceux
     * qui vérifient la transaction demandent un vrai mock.
     *
     * @param ?callable(Vendor): ?PortfolioImage $configureCrushPhoto
     */
    private function makeEntityManager(
        ?VendorStatus $vendorStatus = VendorStatus::Active,
        bool $strict = false,
        ?callable $configureCrushPhoto = null,
    ): object {
        $this->persisted = [];

        $confessions = $this->createStub(EntityRepository::class);
        $confessions->method('findOneBy')->willReturnCallback(
            static fn(array $criteria) => $criteria['slug'] === 'catholique'
                ? (new Confession())->setName('Catholique')->setSlug('catholique')
                : null,
        );

        $cultures = $this->createStub(EntityRepository::class);
        $cultures->method('findOneBy')->willReturnCallback(
            static fn(array $criteria) => $criteria['slug'] === 'europe'
                ? (new Culture())->setName('Europe')->setSlug('europe')
                : null,
        );

        $vendor = null;

        if ($vendorStatus !== null) {
            $vendor = $this->createStub(Vendor::class);
            $vendor->method('getStatus')->willReturn($vendorStatus);
        }

        $crushPhoto = $vendor !== null && $configureCrushPhoto !== null
            ? $configureCrushPhoto($vendor)
            : null;

        $vendors = $this->createStub(EntityRepository::class);
        $vendors->method('findOneBy')->willReturn($vendor);

        $portfolioImages = $this->createStub(EntityRepository::class);
        $portfolioImages->method('findOneBy')->willReturnCallback(
            static function (array $criteria) use ($crushPhoto): ?PortfolioImage {
                if (!$crushPhoto instanceof PortfolioImage) {
                    return null;
                }

                return ($criteria['id'] ?? null) === (string) $crushPhoto->getId()
                    ? $crushPhoto
                    : null;
            },
        );

        $em = $strict
            ? $this->createMock(EntityManagerInterface::class)
            : $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturnCallback(
            static fn(string $className) => match ($className) {
                Confession::class     => $confessions,
                Culture::class        => $cultures,
                Vendor::class         => $vendors,
                PortfolioImage::class => $portfolioImages,
            },
        );
        $em->method('persist')->willReturnCallback(function (object $entity): void {
            $this->persisted[] = $entity;
        });

        return $em;
    }

    private function makeService(object $em, bool $emailTaken = false): CoupleRegistrationService
    {
        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('isEmailTaken')->willReturn($emailTaken);

        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturnCallback(
            static fn(object $user, string $plain): string => 'hashed:' . $plain,
        );

        return new CoupleRegistrationService($em, $userRepository, $hasher);
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $className
     *
     * @return T
     */
    private function persistedOf(string $className): object
    {
        foreach ($this->persisted as $entity) {
            if ($entity instanceof $className) {
                return $entity;
            }
        }

        self::fail(sprintf('Aucune entité %s persistée.', $className));
    }

    private function makeCrushPhoto(Vendor $vendor, bool $visibleInWedream = true): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/crush.jpg')
            ->setSortOrder(0)
            ->setVisibleInWedream($visibleInWedream);

        $idReflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $idReflection->setValue($photo, UuidV7::fromString(self::CRUSH_PHOTO_ID));

        return $photo;
    }

    private function makeDto(
        string $firstName = 'Camille',
        string $location = 'Lyon',
        bool $sensitiveDataConsent = false,
        array $confessionSlugs = [],
        array $cultureSlugs = [],
        ?ProviderContactRequestDto $contactRequest = null,
    ): RegisterCoupleRequestDto {
        return new RegisterCoupleRequestDto(
            email: 'camille@example.test',
            password: 'motdepasse',
            passwordConfirmation: 'motdepasse',
            firstName: $firstName,
            planningStage: PlanningStage::JustStarted,
            weddingDate: new \DateTimeImmutable('+1 year'),
            location: $location,
            budgetCents: 2_350_000,
            guestCount: 100,
            sensitiveDataConsent: $sensitiveDataConsent,
            confessionSlugs: $confessionSlugs,
            cultureSlugs: $cultureSlugs,
            contactRequest: $contactRequest,
        );
    }
}
