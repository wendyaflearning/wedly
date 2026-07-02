<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Enum\Vendor\VenueType;
use App\Enum\Wedding\CultureType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use App\Service\Vendor\AdminVendorDraftService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\UuidV7;

final class AdminVendorDraftServiceTest extends TestCase
{
    public function test_create_draft_persists_vendor_without_invitation_token(): void
    {
        $persistedInviteToken = null;
        $entityManager = $this->makeEntityManager([
            Service::class => ['service-id' => $this->makeServiceEntity()],
            Region::class => ['region-id' => $this->makeRegion()],
        ]);
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->once())->method('commit');
        $entityManager->expects($this->never())->method('rollback');
        $entityManager->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function (object $entity) use (&$persistedInviteToken): void {
                if ($entity instanceof User || $entity instanceof Vendor) {
                    $this->setPrivateProperty($entity, 'id', new UuidV7());
                }
                if ($entity instanceof InviteToken) {
                    $persistedInviteToken = $entity;
                }
            });
        $entityManager->expects($this->once())->method('flush');

        $response = $this->makeDraftService($entityManager)->create($this->makeValidRequest());

        self::assertNull($persistedInviteToken);
        self::assertSame('pending', $response->status);
        self::assertNull($response->invitation);
        self::assertSame('Studio Camille', $response->identity['brandName']);
    }

    public function test_create_rolls_back_when_apply_draft_fails_inside_transaction(): void
    {
        $entityManager = $this->makeEntityManager([Service::class => ['service-id' => null]]);
        $entityManager->expects($this->once())->method('beginTransaction');
        $entityManager->expects($this->once())->method('rollback');
        $entityManager->expects($this->never())->method('commit');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Service not found.');

        $this->makeDraftService($entityManager)->create($this->makeValidRequest());
    }

    public function test_create_rejects_missing_identity_fields_before_transaction(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('beginTransaction');

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Missing required identity or profession fields.');

        $this->makeDraftService($entityManager)->create(new AdminVendorDraftRequestDto(
            firstname: null,
            lastName: null,
            email: null,
            brandName: null,
            serviceId: null,
            regions: ['region-id'],
            priceMin: 100,
            priceMax: 200,
            priceType: PriceType::PerService->value,
            experiences: null,
            legalInfo: null,
            venueCharacteristics: null,
            cateringCharacteristics: null,
        ));
    }

    public function test_create_rejects_missing_pricing_fields(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Missing required pricing fields.');

        $this->makeDraftService()->create(new AdminVendorDraftRequestDto(
            firstname: 'Camille',
            lastName: null,
            email: 'camille@example.fr',
            brandName: 'Studio',
            serviceId: 'service-id',
            regions: [],
            priceMin: null,
            priceMax: null,
            priceType: null,
            experiences: null,
            legalInfo: null,
            venueCharacteristics: null,
            cateringCharacteristics: null,
        ));
    }

    public function test_create_rejects_invalid_price_range_invalid_email_and_duplicate_email(): void
    {
        foreach ([
            ['Invalid price range.', $this->makeRequiredRequest(priceMin: 300, priceMax: 200)],
            ['Invalid email.', $this->makeRequiredRequest(email: 'not-an-email')],
        ] as [$message, $dto]) {
            try {
                $this->makeDraftService()->create($dto);
                $this->fail(sprintf('Expected "%s".', $message));
            } catch (\DomainException $exception) {
                self::assertSame($message, $exception->getMessage());
            }
        }

        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn(new User());

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->expectExceptionMessage('Email already registered.');

        $this->makeDraftService(userRepository: $userRepository)->create($this->makeValidRequest());
    }

    public function test_get_returns_draft_with_latest_invitation(): void
    {
        $vendor = $this->makeReadyVendor();
        $token = $this->inviteToken($vendor, 'latest-token');

        $inviteTokenRepository = $this->createMock(InviteTokenRepository::class);
        $inviteTokenRepository->expects($this->once())->method('findLatestVendorInvitation')->with($vendor)->willReturn($token);

        $response = $this->makeDraftService(inviteTokenRepository: $inviteTokenRepository)->get($vendor);

        self::assertSame('latest-token', $response->invitation['token']);
    }

    public function test_update_applies_full_partial_draft_payload(): void
    {
        $vendor = $this->makeReadyVendor();
        $newService = $this->makeServiceEntity('Traiteur', 'traiteur', VendorType::Traiteur);
        $region = $this->makeRegion('Bretagne', 'bretagne');
        $culture = $this->makeCulture();
        $confession = $this->makeConfession();

        $entityManager = $this->makeEntityManager([
            Service::class => ['service-id' => $newService],
            Region::class => ['region-id' => $region],
            Culture::class => ['culture-id' => $culture],
            Confession::class => ['confession-id' => $confession],
        ]);
        $entityManager->expects($this->exactly(2))->method('persist')->with($this->logicalOr(
            $this->isInstanceOf(VendorVenueDetails::class),
            $this->isInstanceOf(VendorCateringDetails::class)
        ));
        $entityManager->expects($this->once())->method('flush');

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findLatestVendorInvitation')->willReturn(null);

        $response = $this->makeDraftService($entityManager, $inviteTokenRepository)->update($vendor, $this->makeFullUpdateRequest());

        self::assertSame('Updated Brand', $response->identity['brandName']);
        self::assertSame('updated@example.fr', $response->identity['email']);
        self::assertSame($newService->getId()->toRfc4122(), $response->profession['serviceId']);
        self::assertSame([$culture->getId()->toRfc4122()], $response->experiences['cultureIds']);
        self::assertSame([$confession->getId()->toRfc4122()], $response->experiences['confessionIds']);
        self::assertSame([$region->getId()->toRfc4122()], $response->zonesPricing['regions']);
        self::assertSame(200000, $response->zonesPricing['priceMin']);
        self::assertSame('per_person', $response->zonesPricing['priceType']);
        self::assertSame('69001', $response->legalInfo['zipcode']);
        self::assertSame('chateau', $response->venueCharacteristics['venueType']);
        self::assertSame(50, $response->cateringCharacteristics['coversMin']);
    }

    public function test_update_rejects_vendor_with_used_invitation(): void
    {
        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(true);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);

        $this->makeDraftService(inviteTokenRepository: $inviteTokenRepository)
            ->update($this->makeReadyVendor(), $this->makeValidRequest());
    }

    public function test_update_rejects_invalid_draft_values(): void
    {
        $vendor = $this->makeReadyVendor();

        $cases = [
            ['Invalid price type.', $this->makeUpdateRequest(priceType: 'invalid')],
            ['Invalid SIRET.', $this->makeUpdateRequest(legalInfo: ['siret' => '123'])],
            ['Invalid venue type.', $this->makeUpdateRequest(venueCharacteristics: ['venue_type' => 'invalid'])],
            ['capacity_min doit être inférieur à capacity_max.', $this->makeUpdateRequest(venueCharacteristics: ['capacity_min' => 20, 'capacity_max' => 10])],
            ['covers_min doit être inférieur à covers_max.', $this->makeUpdateRequest(cateringCharacteristics: ['covers_min' => 20, 'covers_max' => 10])],
            ['Region id must be a string.', $this->makeUpdateRequest(regions: [123])],
            ['Region not found: missing-region.', $this->makeUpdateRequest(regions: ['missing-region'])],
        ];

        foreach ($cases as [$message, $dto]) {
            try {
                $this->makeDraftService($this->makeEntityManagerStub())->update($vendor, $dto);
                $this->fail(sprintf('Expected "%s".', $message));
            } catch (\DomainException $exception) {
                self::assertSame($message, $exception->getMessage());
            }
        }
    }

    public function test_update_maps_empty_nullable_integer_to_null(): void
    {
        $vendor = $this->makeReadyVendor();

        $response = $this->makeDraftService()->update($vendor, $this->makeUpdateRequest(
            venueCharacteristics: ['distance_to_city_minutes' => '']
        ));

        self::assertNull($response->venueCharacteristics['distanceToCityMinutes']);
    }

    public function test_email_availability_guard_allows_null_email(): void
    {
        $service = $this->makeDraftService();
        $method = new \ReflectionMethod($service, 'assertEmailAvailable');

        $method->invoke($service, null);

        self::assertTrue(true);
    }

    private function makeDraftService(
        ?EntityManagerInterface $entityManager = null,
        ?InviteTokenRepository $inviteTokenRepository = null,
        ?UserRepository $userRepository = null,
    ): AdminVendorDraftService {
        if ($userRepository === null) {
            $userRepository = $this->createStub(UserRepository::class);
            $userRepository->method('findOneBy')->willReturn(null);
        }

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');

        return new AdminVendorDraftService(
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $userRepository,
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $passwordHasher,
        );
    }

    private function makeValidRequest(): AdminVendorDraftRequestDto
    {
        return $this->makeRequiredRequest();
    }

    private function makeRequiredRequest(
        string $email = 'camille@example.fr',
        int $priceMin = 100000,
        int $priceMax = 250000,
    ): AdminVendorDraftRequestDto {
        return new AdminVendorDraftRequestDto(
            firstname: 'Camille',
            lastName: 'Martin',
            email: $email,
            brandName: 'Studio Camille',
            serviceId: 'service-id',
            regions: ['region-id'],
            priceMin: $priceMin,
            priceMax: $priceMax,
            priceType: PriceType::PerService->value,
            experiences: null,
            legalInfo: null,
            venueCharacteristics: null,
            cateringCharacteristics: null,
        );
    }

    private function makeFullUpdateRequest(): AdminVendorDraftRequestDto
    {
        return $this->makeUpdateRequest(
            firstname: 'Updated',
            lastName: 'Vendor',
            email: 'updated@example.fr',
            brandName: 'Updated Brand',
            serviceId: 'service-id',
            regions: ['region-id'],
            priceMin: 200000,
            priceMax: 350000,
            priceType: PriceType::PerPerson->value,
            experiences: ['culture_ids' => ['culture-id'], 'confession_ids' => ['confession-id']],
            legalInfo: [
                'phone' => ' 0611111111 ',
                'address' => ' 1 rue Test ',
                'zipcode' => '69001',
                'city' => 'Lyon',
                'siret' => '12345678901234',
            ],
            venueCharacteristics: [
                'venue_type' => VenueType::Chateau->value,
                'capacity_min' => '80',
                'capacity_max' => '160',
                'has_catering' => true,
                'has_accommodation' => false,
                'has_outdoor_space' => true,
                'has_corkage_fee' => false,
                'has_toilets' => true,
                'is_pmr_accessible' => true,
                'nearest_city' => 'Lyon',
                'distance_to_city_minutes' => '25',
            ],
            cateringCharacteristics: [
                'covers_min' => '50',
                'covers_max' => '140',
                'is_kosher' => false,
                'is_halal' => true,
                'is_vegan' => true,
                'is_gluten_free' => false,
                'offers_table_service' => true,
                'offers_buffet' => false,
                'offers_cocktail' => true,
                'provides_tableware' => true,
                'provides_furniture' => false,
            ],
        );
    }

    private function makeUpdateRequest(
        ?string $firstname = null,
        ?string $lastName = null,
        ?string $email = null,
        ?string $brandName = null,
        ?string $serviceId = null,
        ?array $regions = null,
        ?int $priceMin = null,
        ?int $priceMax = null,
        ?string $priceType = null,
        ?array $experiences = null,
        ?array $legalInfo = null,
        ?array $venueCharacteristics = null,
        ?array $cateringCharacteristics = null,
    ): AdminVendorDraftRequestDto {
        return new AdminVendorDraftRequestDto(
            $firstname,
            $lastName,
            $email,
            $brandName,
            $serviceId,
            $regions,
            $priceMin,
            $priceMax,
            $priceType,
            $experiences,
            $legalInfo,
            $venueCharacteristics,
            $cateringCharacteristics,
        );
    }

    private function makeReadyVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.fr')
            ->setPassword('password');
        $this->setPrivateProperty($user, 'id', new UuidV7());

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille')
            ->setStatus(VendorStatus::Pending)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100000)
            ->setPriceMaxCents(250000);
        $this->setPrivateProperty($vendor, 'id', new UuidV7());
        $vendor->addService($this->makeServiceEntity());
        $vendor->addRegion($this->makeRegion());

        return $vendor;
    }

    private function inviteToken(Vendor $vendor, string $token): InviteToken
    {
        $inviteToken = (new InviteToken())
            ->setToken($token)
            ->setStatus(InviteTokenStatus::Pending)
            ->setPersona(InviteTokenPersona::Vendor)
            ->setVendor($vendor)
            ->setUser($vendor->getUser())
            ->setExpiresAt(new \DateTimeImmutable('+10 days'));
        $this->setPrivateProperty($inviteToken, 'id', new UuidV7());

        return $inviteToken;
    }

    private function makeServiceEntity(
        string $name = 'Photographe',
        string $slug = 'photographe',
        VendorType $category = VendorType::Freelance,
    ): Service {
        $service = (new Service())
            ->setName($name)
            ->setSlug($slug)
            ->setSortOrder(1)
            ->setCategory($category);
        $this->setPrivateProperty($service, 'id', new UuidV7());

        return $service;
    }

    private function makeRegion(string $name = 'Île-de-France', string $slug = 'ile-de-france'): Region
    {
        $region = (new Region())->setName($name)->setSlug($slug);
        $this->setPrivateProperty($region, 'id', new UuidV7());

        return $region;
    }

    private function makeCulture(): Culture
    {
        $culture = (new Culture())->setName('France')->setSlug('france')->setType(CultureType::Country);
        $this->setPrivateProperty($culture, 'id', new UuidV7());

        return $culture;
    }

    private function makeConfession(): Confession
    {
        $confession = (new Confession())->setName('Laic')->setSlug('laic');
        $this->setPrivateProperty($confession, 'id', new UuidV7());

        return $confession;
    }

    private function makeEntityManager(array $entitiesByClass = []): EntityManagerInterface&\PHPUnit\Framework\MockObject\MockObject
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->method('find')->willReturnCallback(
            fn(string $className, string $id): ?object => $entitiesByClass[$className][$id] ?? null
        );

        return $entityManager;
    }

    private function makeEntityManagerStub(array $entitiesByClass = []): EntityManagerInterface
    {
        $entityManager = $this->createStub(EntityManagerInterface::class);
        $entityManager->method('find')->willReturnCallback(
            fn(string $className, string $id): ?object => $entitiesByClass[$className][$id] ?? null
        );

        return $entityManager;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
