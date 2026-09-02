<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Couple;

use App\DTO\Couple\ProviderContactRequestDto;
use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
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
use App\Service\Vendor\VendorResolver;
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

    /**
     * WED-216 : sans cette écriture le téléphone est validé puis jeté — le
     * champ existerait en base sans jamais être rempli.
     */
    public function test_it_persists_the_phone_number_in_its_international_form(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto(phone: '0612345678'));

        self::assertSame('+33612345678', $this->persistedOf(Couple::class)->getPhone());
    }

    public function test_a_phone_number_already_international_is_stored_as_is(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto(phone: '+33612345678'));

        self::assertSame('+33612345678', $this->persistedOf(Couple::class)->getPhone());
    }

    /**
     * Le téléphone reste optionnel : pas de chaîne vide en base pour une
     * question à laquelle le couple n'a pas répondu.
     */
    public function test_a_registration_without_a_phone_number_leaves_it_null(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto());

        self::assertNull($this->persistedOf(Couple::class)->getPhone());
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
            contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID)],
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

        $this->makeService(
            $this->makeEntityManager(),
            $this->makeVendorResolver(vendorStatus: VendorStatus::Pending),
        )->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID)]),
        );
    }

    public function test_an_unknown_vendor_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService(
            $this->makeEntityManager(),
            $this->makeVendorResolver(vendorStatus: null),
        )->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID)]),
        );
    }

    public function test_an_unknown_crush_photo_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager())->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)]),
        );
    }

    public function test_a_crush_photo_from_another_vendor_is_refused(): void
    {
        $otherVendor = $this->createStub(Vendor::class);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($otherVendor),
        ))->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)]),
        );
    }

    public function test_a_crush_photo_not_visible_in_wedream_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($vendor, visibleInWedream: false),
        ))->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID, self::CRUSH_PHOTO_ID)]),
        );
    }

    /**
     * WED-150 : le parcours cible en réalité une photo, pas un identifiant de
     * prestataire. Sans `vendorId`, le serveur remonte au prestataire depuis la
     * photo coup de cœur, et le lead pointe le propriétaire de celle-ci.
     */
    public function test_a_contact_request_without_a_vendor_id_resolves_the_vendor_from_the_crush_photo(): void
    {
        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($vendor),
        ))->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(portfolioImageId: self::CRUSH_PHOTO_ID)]),
        );

        $lead  = $this->persistedOf(ProviderLead::class);
        $photo = $lead->getPortfolioImage();

        self::assertNotNull($photo);
        self::assertSame($photo->getVendor(), $lead->getVendor());
        self::assertSame(ProviderLeadStatus::Pending, $lead->getStatus());
    }

    public function test_a_crush_photo_not_visible_in_wedream_is_refused_when_it_carries_the_vendor(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($vendor, visibleInWedream: false),
        ))->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(portfolioImageId: self::CRUSH_PHOTO_ID)]),
        );
    }

    /**
     * `isVisibleInWedream` est recalculé au tagging, pas à chaque changement de
     * statut du prestataire : une photo encore taguée visible ne suffit donc pas
     * à rendre son propriétaire joignable.
     */
    public function test_a_visible_photo_of_an_inactive_vendor_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            vendorStatus: VendorStatus::Pending,
            configureCrushPhoto: fn (Vendor $vendor) => $this->makeCrushPhoto($vendor),
        ))->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto(portfolioImageId: self::CRUSH_PHOTO_ID)]),
        );
    }

    /**
     * La contrainte de classe du DTO ferme déjà ce cas en amont (cf.
     * RegisterCoupleRequestDtoTest) ; le service refuse quand même, il est aussi
     * appelable sans passer par MapRequestPayload.
     */
    public function test_a_contact_request_targeting_nothing_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($this->makeEntityManager())->register(
            $this->makeDto(contactRequests: [new ProviderContactRequestDto()]),
        );
    }

    /**
     * PROVIDER-LEAD-007 : deux photos d'un même prestataire, c'est une seule
     * mise en relation. La première demande de la liste gagne, avec sa photo —
     * c'est elle que le prestataire verra, pas la dernière cliquée.
     */
    public function test_two_contact_requests_to_the_same_vendor_create_a_single_lead(): void
    {
        $vendor = $this->makeVendor(self::VENDOR_ID);
        $first  = $this->makeCrushPhoto($vendor);
        $second = $this->makeCrushPhoto($vendor, id: self::SECOND_PHOTO_ID);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            vendorsById: $this->byId([$vendor]),
            imagesById: $this->byId([$first, $second]),
        ))->register($this->makeDto(contactRequests: [
            new ProviderContactRequestDto(portfolioImageId: self::CRUSH_PHOTO_ID),
            new ProviderContactRequestDto(portfolioImageId: self::SECOND_PHOTO_ID),
        ]));

        $leads = $this->allPersistedOf(ProviderLead::class);

        self::assertCount(1, $leads);
        self::assertSame($vendor, $leads[0]->getVendor());
        self::assertSame($first, $leads[0]->getPortfolioImage());
    }

    public function test_two_contact_requests_to_two_vendors_create_two_leads(): void
    {
        $vendor      = $this->makeVendor(self::VENDOR_ID);
        $otherVendor = $this->makeVendor(self::OTHER_VENDOR_ID);
        $photo       = $this->makeCrushPhoto($vendor);
        $otherPhoto  = $this->makeCrushPhoto($otherVendor, id: self::OTHER_VENDOR_PHOTO_ID);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            vendorsById: $this->byId([$vendor, $otherVendor]),
            imagesById: $this->byId([$photo, $otherPhoto]),
        ))->register($this->makeDto(contactRequests: [
            new ProviderContactRequestDto(portfolioImageId: self::CRUSH_PHOTO_ID),
            new ProviderContactRequestDto(portfolioImageId: self::OTHER_VENDOR_PHOTO_ID),
        ]));

        $leads = $this->allPersistedOf(ProviderLead::class);

        self::assertCount(2, $leads);
        self::assertSame([$vendor, $otherVendor], array_map(
            static fn(ProviderLead $lead): Vendor => $lead->getVendor(),
            $leads,
        ));
    }

    public function test_each_pin_creates_a_couple_pin_attached_to_the_couple(): void
    {
        $vendor = $this->makeVendor(self::VENDOR_ID);
        $first  = $this->makeCrushPhoto($vendor);
        $second = $this->makeCrushPhoto($vendor, id: self::SECOND_PHOTO_ID);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            vendorsById: $this->byId([$vendor]),
            imagesById: $this->byId([$first, $second]),
        ))->register($this->makeDto(pins: [self::CRUSH_PHOTO_ID, self::SECOND_PHOTO_ID]));

        $pins   = $this->allPersistedOf(CouplePin::class);
        $couple = $this->persistedOf(Couple::class);

        self::assertCount(2, $pins);
        self::assertSame([$first, $second], array_map(
            static fn(CouplePin $pin): PortfolioImage => $pin->getPortfolioImage(),
            $pins,
        ));
        self::assertSame([$couple, $couple], array_map(
            static fn(CouplePin $pin): Couple => $pin->getCouple(),
            $pins,
        ));
    }

    /**
     * Le parcours peut n'avoir rien accumulé : l'inscription reste une
     * inscription, elle ne dépend d'aucun coup de cœur.
     */
    public function test_an_empty_journey_registers_without_a_lead_or_a_pin(): void
    {
        $this->makeService($this->makeEntityManager())->register($this->makeDto());

        self::assertSame([], $this->allPersistedOf(ProviderLead::class));
        self::assertSame([], $this->allPersistedOf(CouplePin::class));
        self::assertInstanceOf(User::class, $this->persistedOf(User::class));
    }

    /**
     * Tout est résolu avant l'ouverture de la transaction : un pin incohérent
     * sort en 422 sans qu'aucune écriture n'ait commencé. Il n'y a donc rien à
     * annuler — assertion plus forte qu'un rollback.
     */
    public function test_an_unknown_pin_is_refused_before_anything_is_written(): void
    {
        $vendor = $this->makeVendor(self::VENDOR_ID);
        $photo  = $this->makeCrushPhoto($vendor);

        $em             = $this->makeEntityManager(strict: true);
        $vendorResolver = $this->makeVendorResolver(
            vendorsById: $this->byId([$vendor]),
            imagesById: $this->byId([$photo]),
        );
        $em->expects($this->never())->method('persist');
        $em->expects($this->never())->method('beginTransaction');
        $em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($em, $vendorResolver)->register(
            $this->makeDto(pins: [self::CRUSH_PHOTO_ID, self::UNKNOWN_PHOTO_ID]),
        );
    }

    /**
     * WED-193 : le prestataire a coupé sa vitrine Wedream entre le browse et
     * l'envoi du formulaire d'inscription. Le pin posé à l'inscription passe par
     * la même porte que les autres chemins — il est refusé en 422, aucune ligne
     * `couple_pin` invisible n'est créée.
     */
    public function test_a_pin_whose_vendor_left_wedream_is_refused_before_anything_is_written(): void
    {
        $vendor = $this->makeVendor(self::VENDOR_ID)->setWedreamEnabled(false);
        $photo  = $this->makeCrushPhoto($vendor);

        $em             = $this->makeEntityManager(strict: true);
        $vendorResolver = $this->makeVendorResolver(imagesById: $this->byId([$photo]));
        $em->expects($this->never())->method('persist');
        $em->expects($this->never())->method('beginTransaction');
        $em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);

        $this->makeService($em, $vendorResolver)->register(
            $this->makeDto(pins: [self::CRUSH_PHOTO_ID]),
        );
    }

    /**
     * TODO WED-152 : ces deux tests couvrent le shim de compatibilité et
     * disparaîtront avec lui, une fois le frontend basculé sur
     * `contactRequests`.
     */
    public function test_the_legacy_single_contact_request_still_creates_a_lead(): void
    {
        $this->makeService($this->makeEntityManager())->register(
            $this->makeDto(contactRequest: new ProviderContactRequestDto(self::VENDOR_ID)),
        );

        self::assertCount(1, $this->allPersistedOf(ProviderLead::class));
    }

    public function test_the_contact_requests_array_wins_over_the_legacy_field(): void
    {
        $vendor      = $this->makeVendor(self::VENDOR_ID);
        $otherVendor = $this->makeVendor(self::OTHER_VENDOR_ID);

        $this->makeService($this->makeEntityManager(), $this->makeVendorResolver(
            vendorsById: $this->byId([$vendor, $otherVendor]),
        ))->register($this->makeDto(
            contactRequests: [new ProviderContactRequestDto(self::VENDOR_ID)],
            contactRequest: new ProviderContactRequestDto(self::OTHER_VENDOR_ID),
        ));

        $leads = $this->allPersistedOf(ProviderLead::class);

        self::assertCount(1, $leads);
        self::assertSame($vendor, $leads[0]->getVendor());
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
    private const OTHER_VENDOR_ID = '0198f1c2-0000-7000-8000-000000000002';
    private const SECOND_PHOTO_ID = '0198f1c2-0000-7000-8000-000000000003';
    private const OTHER_VENDOR_PHOTO_ID = '0198f1c2-0000-7000-8000-000000000004';
    private const UNKNOWN_PHOTO_ID = '0198f1c2-0000-7000-8000-00000000000f';

    /**
     * PHPUnit 12 signale un mock sans attente : les tests qui se contentent
     * d'inspecter les entités persistées reçoivent donc un stub, et seuls ceux
     * qui vérifient la transaction demandent un vrai mock.
     *
     * Depuis WED-153, l'EntityManager ne porte plus que les tables de référence
     * (Confession, Culture) et la transaction : la résolution prestataire/photo
     * est passée derrière VendorResolver, montée par makeVendorResolver().
     */
    private function makeEntityManager(bool $strict = false): object
    {
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

        $em = $strict
            ? $this->createMock(EntityManagerInterface::class)
            : $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturnCallback(
            static fn(string $className) => match ($className) {
                Confession::class => $confessions,
                Culture::class    => $cultures,
            },
        );
        $em->method('persist')->willReturnCallback(function (object $entity): void {
            $this->persisted[] = $entity;
        });

        return $em;
    }

    /**
     * WED-153 : le service ne résout plus lui-même le prestataire, il délègue à
     * VendorResolver — c'est donc lui que ces tests doublent. Le stub rejoue les
     * mêmes règles à partir des mêmes catalogues, avec les messages et les codes
     * 422 exacts du service réel ; la couverture de ces règles, elle, vit dans
     * VendorResolverTest.
     *
     * @param ?callable(Vendor): ?PortfolioImage $configureCrushPhoto
     * @param array<string, Vendor>              $vendorsById
     * @param array<string, PortfolioImage>      $imagesById
     */
    private function makeVendorResolver(
        ?VendorStatus $vendorStatus = VendorStatus::Active,
        ?callable $configureCrushPhoto = null,
        array $vendorsById = [],
        array $imagesById = [],
        bool $vendorPublished = true,
        bool $vendorWedreamEnabled = true,
    ): object {
        $vendor = null;

        if ($vendorStatus !== null) {
            $vendor = $this->createStub(Vendor::class);
            $vendor->method('getStatus')->willReturn($vendorStatus);
            $vendor->method('isPublished')->willReturn($vendorPublished);
            $vendor->method('isWedreamEnabled')->willReturn($vendorWedreamEnabled);
        }

        $crushPhoto = $vendor !== null && $configureCrushPhoto !== null
            ? $configureCrushPhoto($vendor)
            : null;

        // Les catalogues explicites servent les scénarios à plusieurs
        // prestataires ou plusieurs photos ; sans eux, le prestataire unique
        // historique répond à n'importe quel identifiant.
        $findVendor = static fn(mixed $id): ?Vendor => $vendorsById === []
            ? $vendor
            : ($vendorsById[(string) $id] ?? null);

        $findVisible = static function (string $portfolioImageId) use ($crushPhoto, $imagesById): PortfolioImage {
            if ($imagesById !== []) {
                $image = $imagesById[$portfolioImageId] ?? null;
            } elseif ($crushPhoto instanceof PortfolioImage && $portfolioImageId === (string) $crushPhoto->getId()) {
                $image = $crushPhoto;
            } else {
                $image = null;
            }

            // WED-193 : « publiée dans Wedream » = les trois conditions
            // ensemble, comme dans VendorResolver réel.
            if (
                !$image instanceof PortfolioImage
                || !$image->isVisibleInWedream()
                || !$image->getVendor()->isPublished()
                || !$image->getVendor()->isWedreamEnabled()
            ) {
                throw new \DomainException('Cette photo n\'est pas disponible.', 422);
            }

            return $image;
        };

        $resolver = $this->createStub(VendorResolver::class);
        $resolver->method('findVisiblePortfolioImage')->willReturnCallback($findVisible);
        $resolver->method('resolveCrushPhoto')->willReturnCallback(
            static function (Vendor $owner, string $portfolioImageId) use ($findVisible): PortfolioImage {
                $image = $findVisible($portfolioImageId);

                if ($image->getVendor() !== $owner) {
                    throw new \DomainException('Cette photo n\'est pas disponible.', 422);
                }

                return $image;
            },
        );
        $resolver->method('resolveActive')->willReturnCallback(
            static function (?string $vendorId, ?string $portfolioImageId) use ($findVendor, $findVisible): Vendor {
                if ($vendorId !== null) {
                    $resolved = $findVendor($vendorId);
                } elseif ($portfolioImageId !== null) {
                    $resolved = $findVisible($portfolioImageId)->getVendor();
                } else {
                    throw new \DomainException('Cette demande de contact ne cible aucun prestataire.', 422);
                }

                if (
                    !$resolved instanceof Vendor
                    || $resolved->getStatus() !== VendorStatus::Active
                    || !$resolved->isPublished()
                    || !$resolved->isWedreamEnabled()
                ) {
                    throw new \DomainException('Ce prestataire n\'est pas disponible.', 422);
                }

                return $resolved;
            },
        );

        return $resolver;
    }

    private function makeService(
        object $em,
        ?object $vendorResolver = null,
        bool $emailTaken = false,
    ): CoupleRegistrationService {
        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('isEmailTaken')->willReturn($emailTaken);

        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturnCallback(
            static fn(object $user, string $plain): string => 'hashed:' . $plain,
        );

        return new CoupleRegistrationService(
            $em,
            $userRepository,
            $hasher,
            $vendorResolver ?? $this->makeVendorResolver(),
        );
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

    private function makeCrushPhoto(
        Vendor $vendor,
        bool $visibleInWedream = true,
        string $id = self::CRUSH_PHOTO_ID,
    ): PortfolioImage {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/crush.jpg')
            ->setSortOrder(0)
            ->setVisibleInWedream($visibleInWedream);

        $idReflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $idReflection->setValue($photo, UuidV7::fromString($id));

        return $photo;
    }

    /**
     * Le dédoublonnage des leads compare des identifiants de prestataire : un
     * stub sans `id` ne suffit plus, il faut de vraies entités.
     */
    private function makeVendor(string $id, VendorStatus $status = VendorStatus::Active): Vendor
    {
        $vendor = (new Vendor())
            ->setStatus($status)
            ->setIsPublished(true)
            ->setWedreamEnabled(true);

        $idReflection = new \ReflectionProperty(Vendor::class, 'id');
        $idReflection->setValue($vendor, UuidV7::fromString($id));

        return $vendor;
    }

    /**
     * @param object[] $entities
     *
     * @return array<string, object>
     */
    private function byId(array $entities): array
    {
        $indexed = [];

        foreach ($entities as $entity) {
            $indexed[(string) $entity->getId()] = $entity;
        }

        return $indexed;
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $className
     *
     * @return T[]
     */
    private function allPersistedOf(string $className): array
    {
        return array_values(array_filter(
            $this->persisted,
            static fn(object $entity): bool => $entity instanceof $className,
        ));
    }

    private function makeDto(
        string $firstName = 'Camille',
        string $location = 'Lyon',
        bool $sensitiveDataConsent = false,
        array $confessionSlugs = [],
        array $cultureSlugs = [],
        array $contactRequests = [],
        array $pins = [],
        ?ProviderContactRequestDto $contactRequest = null,
        ?string $phone = null,
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
            contactRequests: $contactRequests,
            pins: $pins,
            contactRequest: $contactRequest,
            phone: $phone,
        );
    }
}
