<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Couple;

use App\DTO\Couple\RegisterRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use App\Enum\Couple\ConsentType;
use App\Enum\Couple\PlanningStage;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorStatus;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Couple\CoupleRegistrationService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class CoupleRegistrationServiceTest extends TestCase
{
    /** @var object[] */
    private array $persisted = [];

    public function test_register_creates_the_account_the_wedding_and_the_couple_at_once(): void
    {
        $service = $this->createService();

        $user = $service->register($this->dto());

        $this->assertSame('camille@exemple.fr', $user->getEmail());
        $this->assertSame('Camille', $user->getFirstName());
        $this->assertSame('hashed:secret-password', $user->getPassword());
        $this->assertSame(UserStatus::Active, $user->getStatus());

        $wedding = $this->persistedOf(Wedding::class);
        $this->assertSame('2027-06-18', $wedding->getDate()->format('Y-m-d'));
        $this->assertSame('Lyon', $wedding->getLocation());
        $this->assertSame(2_350_000, $wedding->getBudgetCents());
        $this->assertSame(120, $wedding->getGuestCount());

        $couple = $this->persistedOf(Couple::class);
        $this->assertSame($user, $couple->getUser());
        $this->assertSame($wedding, $couple->getWedding());
        $this->assertSame(PlanningStage::InProgress, $couple->getPlanningStage());
    }

    public function test_register_refuses_an_email_already_taken_without_creating_anything(): void
    {
        $service = $this->createService(existingUser: new User());

        try {
            $service->register($this->dto());
            $this->fail('A duplicate email must be refused.');
        } catch (\DomainException $exception) {
            $this->assertSame(409, $exception->getCode());
        }

        $this->assertSame([], $this->persisted);
    }

    public function test_register_records_the_consent_and_the_sensitive_preferences_when_it_is_granted(): void
    {
        $confession = (new Confession())->setSlug('catholique');
        $culture = (new Culture())->setSlug('europe');
        $service = $this->createService(confessions: [$confession], cultures: [$culture]);

        $service->register($this->dto(
            sensitiveDataConsent: true,
            confessionSlugs: ['catholique'],
            cultureSlugs: ['europe'],
        ));

        $wedding = $this->persistedOf(Wedding::class);
        $this->assertSame([$confession], $wedding->getConfessions()->toArray());
        $this->assertSame([$culture], $wedding->getCultures()->toArray());

        $consent = $this->persistedOf(WeddingConsent::class);
        $this->assertSame(ConsentType::SensitiveData, $consent->getConsentType());
        $this->assertTrue($consent->isGranted());
    }

    public function test_register_stores_no_sensitive_preference_when_the_consent_is_refused(): void
    {
        $confession = (new Confession())->setSlug('catholique');
        $service = $this->createService(confessions: [$confession]);

        // A refusal reaching the server with selections behind it is exactly the
        // couple that walked back to screen 3 and changed its mind.
        $service->register($this->dto(sensitiveDataConsent: false, confessionSlugs: ['catholique']));

        $this->assertTrue($this->persistedOf(Wedding::class)->getConfessions()->isEmpty());
        $this->assertFalse($this->persistedOf(WeddingConsent::class)->isGranted());
    }

    public function test_register_creates_a_pending_lead_when_the_journey_started_on_a_contact_request(): void
    {
        $vendor = $this->vendor(VendorStatus::Active);
        $service = $this->createService(vendor: $vendor);

        $service->register($this->dto(vendorId: '0198f0a1-0000-7000-8000-000000000001'));

        $lead = $this->persistedOf(ProviderLead::class);
        $this->assertSame($vendor, $lead->getVendor());
        $this->assertSame($this->persistedOf(Couple::class), $lead->getCouple());
        // The lead carries its own copy of the wedding budget (PROVIDER-LEAD-002).
        $this->assertSame(2_350_000, $lead->getBudgetCents());
    }

    public function test_register_creates_no_lead_for_a_couple_that_came_from_a_pin(): void
    {
        $service = $this->createService();

        $service->register($this->dto(vendorId: null));

        $this->assertNull($this->firstPersistedOf(ProviderLead::class));
    }

    public function test_register_refuses_a_vendor_that_can_no_longer_answer(): void
    {
        $service = $this->createService(vendor: $this->vendor(VendorStatus::Rejected));

        try {
            $service->register($this->dto(vendorId: '0198f0a1-0000-7000-8000-000000000001'));
            $this->fail('An inactive vendor must be refused.');
        } catch (\DomainException $exception) {
            $this->assertSame(422, $exception->getCode());
        }

        $this->assertSame([], $this->persisted);
    }

    public function test_register_refuses_a_vendor_that_does_not_exist(): void
    {
        $service = $this->createService(vendor: null);

        $this->expectException(\DomainException::class);

        $service->register($this->dto(vendorId: '0198f0a1-0000-7000-8000-000000000001'));
    }

    /**
     * @param Confession[] $confessions
     * @param Culture[]    $cultures
     */
    private function createService(
        ?User $existingUser = null,
        ?Vendor $vendor = null,
        array $confessions = [],
        array $cultures = [],
    ): CoupleRegistrationService {
        $this->persisted = [];

        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('persist')->willReturnCallback(function (object $entity): void {
            $this->persisted[] = $entity;
        });
        $em->method('wrapInTransaction')->willReturnCallback(static fn(callable $work) => $work($em));
        $em->method('getRepository')->willReturnCallback(function (string $class) use ($confessions, $cultures): EntityRepository {
            $repository = $this->createStub(EntityRepository::class);
            $repository->method('findBy')->willReturn($class === Confession::class ? $confessions : $cultures);

            return $repository;
        });

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturnCallback(
            static fn(User $user, string $plain): string => 'hashed:' . $plain,
        );

        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn($existingUser);

        $vendorRepository = $this->createStub(VendorRepository::class);
        $vendorRepository->method('find')->willReturn($vendor);

        return new CoupleRegistrationService($em, $passwordHasher, $userRepository, $vendorRepository);
    }

    /**
     * @param string[] $confessionSlugs
     * @param string[] $cultureSlugs
     */
    private function dto(
        bool $sensitiveDataConsent = false,
        array $confessionSlugs = [],
        array $cultureSlugs = [],
        ?string $vendorId = null,
    ): RegisterRequestDto {
        return new RegisterRequestDto(
            email: 'camille@exemple.fr',
            password: 'secret-password',
            passwordConfirmation: 'secret-password',
            firstName: 'Camille',
            planningStage: PlanningStage::InProgress->value,
            weddingDate: new \DateTimeImmutable('2027-06-18'),
            location: 'Lyon',
            budgetCents: 2_350_000,
            guestCount: 120,
            sensitiveDataConsent: $sensitiveDataConsent,
            confessionSlugs: $confessionSlugs,
            cultureSlugs: $cultureSlugs,
            vendorId: $vendorId,
        );
    }

    private function vendor(VendorStatus $status): Vendor
    {
        return (new Vendor())->setStatus($status);
    }

    /**
     * @template T of object
     * @param class-string<T> $class
     * @return T
     */
    private function persistedOf(string $class): object
    {
        $entity = $this->firstPersistedOf($class);

        $this->assertNotNull($entity, sprintf('No %s was persisted.', $class));

        return $entity;
    }

    /**
     * @template T of object
     * @param class-string<T> $class
     * @return T|null
     */
    private function firstPersistedOf(string $class): ?object
    {
        foreach ($this->persisted as $entity) {
            if ($entity instanceof $class) {
                return $entity;
            }
        }

        return null;
    }
}
