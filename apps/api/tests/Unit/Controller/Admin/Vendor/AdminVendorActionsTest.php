<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Vendor;

use App\Controller\Admin\Vendor\CreateVendorAction;
use App\Controller\Admin\Vendor\CreateVendorDraftAction;
use App\Controller\Admin\Vendor\GetVendorAction;
use App\Controller\Admin\Vendor\GetVendorDraftAction;
use App\Controller\Admin\Vendor\ListVendorDraftsAction;
use App\Controller\Admin\Vendor\ListVendorInvitationsAction;
use App\Controller\Admin\Vendor\ListVendorsAction;
use App\Controller\Admin\Vendor\RejectVendorAction;
use App\Controller\Admin\Vendor\SendVendorInvitationAction;
use App\Controller\Admin\Vendor\UpdateVendorDraftAction;
use App\Controller\Admin\Vendor\ValidateVendorAction;
use App\DTO\Admin\Vendor\RejectVendorRequestDto;
use App\DTO\Vendor\CreateVendorInputDto;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Repository\User\InviteTokenRepository;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorDraftService;
use App\Service\Vendor\AdminVendorInvitationService;
use App\Service\Vendor\AdminVendorReviewService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\InMemoryUser;
use Symfony\Component\Uid\UuidV7;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class AdminVendorActionsTest extends TestCase
{
    public function test_create_vendor_action_maps_input_to_admin_draft_and_returns_created_payload(): void
    {
        $action = new CreateVendorAction($this->makeDraftServiceForCreate());

        $response = $action(new CreateVendorInputDto(
            firstname: 'Camille',
            email: 'camille@example.fr',
            brand_name: 'Studio Camille',
            service_id: 'service-id',
            regions: ['region-id'],
            price_min: 100000,
            price_max: 250000,
            price_type: PriceType::PerService,
        ));

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('Studio Camille', $this->decode($response)['identity']['brandName']);
    }

    public function test_create_vendor_action_returns_domain_error(): void
    {
        $action = new CreateVendorAction($this->makeDraftService());

        $response = $action(new CreateVendorInputDto(
            firstname: 'Camille',
            email: 'camille@example.fr',
            brand_name: 'Studio Camille',
            service_id: 'service-id',
            regions: ['region-id'],
            price_min: 300,
            price_max: 200,
            price_type: PriceType::PerService,
        ));

        self::assertSame(422, $response->getStatusCode());
        self::assertSame(['error' => 'Invalid price range.'], $this->decode($response));
    }

    public function test_create_vendor_draft_action_decodes_json_and_returns_created_payload(): void
    {
        $action = new CreateVendorDraftAction($this->makeDraftServiceForCreate());

        $response = $action(new Request(content: json_encode($this->createPayload(), JSON_THROW_ON_ERROR)));

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('pending', $this->decode($response)['status']);
    }

    public function test_create_vendor_draft_action_returns_domain_error(): void
    {
        $action = new CreateVendorDraftAction($this->makeDraftService());

        $response = $action(new Request(content: json_encode(['firstname' => 'Camille'], JSON_THROW_ON_ERROR)));

        self::assertSame(422, $response->getStatusCode());
        self::assertSame(['error' => 'Missing required identity or profession fields.'], $this->decode($response));
    }

    public function test_get_vendor_action_returns_404_or_profile_payload(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('findAdminProfile')->willReturn(null);

        $missingResponse = (new GetVendorAction($missingRepository))('missing-id');

        self::assertSame(404, $missingResponse->getStatusCode());
        self::assertSame(['error' => 'Vendor not found.'], $this->decode($missingResponse));

        $vendor = $this->makeVendor();
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminProfile')->willReturn($vendor);

        $response = (new GetVendorAction($repository))($vendor->getId()->toRfc4122());

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Studio Camille', $this->decode($response)['summary']['brandName']);
    }

    public function test_get_vendor_draft_action_returns_404_or_draft_payload(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('findAdminProfile')->willReturn(null);

        $missingResponse = (new GetVendorDraftAction($missingRepository, $this->makeDraftService()))('missing-id');

        self::assertSame(404, $missingResponse->getStatusCode());
        self::assertSame(['error' => 'Vendor not found.'], $this->decode($missingResponse));

        $vendor = $this->makeVendor();
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminProfile')->willReturn($vendor);

        $response = (new GetVendorDraftAction($repository, $this->makeDraftService()))($vendor->getId()->toRfc4122());

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Studio Camille', $this->decode($response)['identity']['brandName']);
    }

    public function test_list_vendor_drafts_action_returns_draft_list(): void
    {
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminDrafts')->willReturn([$this->makeVendor()]);

        $response = (new ListVendorDraftsAction($repository))();

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(1, $this->decode($response)['total']);
    }

    public function test_list_vendor_invitations_action_returns_items_or_domain_error(): void
    {
        $vendor = $this->makeVendor();
        $inviteToken = $this->makeInviteToken($vendor, 'active-token');

        $repository = $this->createStub(InviteTokenRepository::class);
        $repository->method('findActiveVendorInvitations')->willReturn([$inviteToken]);

        $response = (new ListVendorInvitationsAction($this->makeInvitationService(inviteTokenRepository: $repository)))(
            new Request(query: ['scope' => 'active'])
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('active-token', $this->decode($response)['items'][0]['token']);

        $errorResponse = (new ListVendorInvitationsAction($this->makeInvitationService(inviteTokenRepository: $repository)))(
            new Request(query: ['scope' => 'unsupported'])
        );

        self::assertSame(422, $errorResponse->getStatusCode());
        self::assertSame(['error' => 'Invalid invitation scope.'], $this->decode($errorResponse));
    }

    public function test_list_vendors_action_validates_status_filter_and_returns_summary(): void
    {
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findForAdminReview')->willReturn([$this->makeVendor(status: VendorStatus::UnderReview)]);
        $repository->method('countAdminReviewableVendors')->willReturn(3);

        $response = (new ListVendorsAction($repository))(new Request(query: ['status' => 'under_review']));

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(3, $this->decode($response)['totalAll']);

        $errorResponse = (new ListVendorsAction($repository))(new Request(query: ['status' => 'pending']));

        self::assertSame(422, $errorResponse->getStatusCode());
        self::assertSame(['error' => 'Invalid status filter.'], $this->decode($errorResponse));
    }

    public function test_reject_vendor_action_returns_404_domain_error_or_success(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('find')->willReturn(null);

        $missingResponse = (new RejectVendorAction($missingRepository, $this->makeReviewService(flushCount: 0)))(
            'missing-id',
            new RejectVendorRequestDto([], null)
        );

        self::assertSame(404, $missingResponse->getStatusCode());

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('find')->willReturn($this->makeVendor());

        $errorResponse = (new RejectVendorAction($repository, $this->makeReviewService(flushCount: 0)))(
            'vendor-id',
            new RejectVendorRequestDto([], null)
        );

        self::assertSame(422, $errorResponse->getStatusCode());
        self::assertSame(['error' => 'At least one rejection reason is required.'], $this->decode($errorResponse));

        $successResponse = (new RejectVendorAction($repository, $this->makeReviewService()))(
            'vendor-id',
            new RejectVendorRequestDto([VendorRejectionReason::Other->value], 'À clarifier.')
        );

        self::assertSame(200, $successResponse->getStatusCode());
        self::assertSame(['message' => 'Vendor rejected.', 'status' => 'rejected'], $this->decode($successResponse));
    }

    public function test_send_vendor_invitation_action_handles_404_runtime_domain_and_success(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('findAdminProfile')->willReturn(null);

        $missingResponse = (new SendVendorInvitationAction(
            $missingRepository,
            $this->makeInvitationService(),
            $this->makeSecurity(new User())
        ))('missing-id');

        self::assertSame(404, $missingResponse->getStatusCode());

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminProfile')->willReturn($this->makeVendor());

        $this->expectException(\RuntimeException::class);
        (new SendVendorInvitationAction(
            $repository,
            $this->makeInvitationService(),
            $this->makeSecurity(new InMemoryUser('admin@example.fr', 'password'))
        ))('vendor-id');
    }

    public function test_send_vendor_invitation_action_returns_domain_error_or_success(): void
    {
        $incompleteVendor = (new Vendor())
            ->setUser((new User())->setFirstName('')->setEmail('')->setPassword('password'))
            ->setBrandName('')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100)
            ->setPriceMaxCents(200);
        $this->setPrivateProperty($incompleteVendor, 'id', new UuidV7());

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminProfile')->willReturn($incompleteVendor);

        $errorResponse = (new SendVendorInvitationAction(
            $repository,
            $this->makeInvitationService(),
            $this->makeSecurity($this->makeAdmin())
        ))('vendor-id');

        self::assertSame(422, $errorResponse->getStatusCode());
        self::assertSame(['error' => 'Missing required identity fields.'], $this->decode($errorResponse));

        $vendor = $this->makeVendor();
        $token = $this->makeInviteToken($vendor, 'active-token');
        $successRepository = $this->createStub(VendorRepository::class);
        $successRepository->method('findAdminProfile')->willReturn($vendor);

        $inviteTokenRepository = $this->createStub(InviteTokenRepository::class);
        $inviteTokenRepository->method('hasUsedVendorInvitation')->willReturn(false);
        $inviteTokenRepository->method('findActiveVendorInvitation')->willReturn($token);

        $response = (new SendVendorInvitationAction(
            $successRepository,
            $this->makeInvitationService(inviteTokenRepository: $inviteTokenRepository),
            $this->makeSecurity($this->makeAdmin())
        ))($vendor->getId()->toRfc4122());

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('active-token', $this->decode($response)['inviteToken']);
    }

    public function test_update_vendor_draft_action_returns_404_domain_error_or_success(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('findAdminProfile')->willReturn(null);

        $missingResponse = (new UpdateVendorDraftAction($missingRepository, $this->makeDraftService()))(
            'missing-id',
            new Request(content: '{}')
        );

        self::assertSame(404, $missingResponse->getStatusCode());

        $vendor = $this->makeVendor();
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findAdminProfile')->willReturn($vendor);

        $errorResponse = (new UpdateVendorDraftAction($repository, $this->makeDraftService()))(
            $vendor->getId()->toRfc4122(),
            new Request(content: json_encode(['price_type' => 'invalid'], JSON_THROW_ON_ERROR))
        );

        self::assertSame(422, $errorResponse->getStatusCode());
        self::assertSame(['error' => 'Invalid price type.'], $this->decode($errorResponse));

        $response = (new UpdateVendorDraftAction($repository, $this->makeDraftService()))(
            $vendor->getId()->toRfc4122(),
            new Request(content: json_encode(['brand_name' => 'Updated Brand'], JSON_THROW_ON_ERROR))
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Updated Brand', $this->decode($response)['identity']['brandName']);
    }

    public function test_validate_vendor_action_returns_404_or_success(): void
    {
        $missingRepository = $this->createStub(VendorRepository::class);
        $missingRepository->method('find')->willReturn(null);

        $missingResponse = (new ValidateVendorAction($missingRepository, $this->makeReviewService(flushCount: 0)))('missing-id');

        self::assertSame(404, $missingResponse->getStatusCode());

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('find')->willReturn($this->makeVendor(status: VendorStatus::UnderReview));

        $response = (new ValidateVendorAction($repository, $this->makeReviewService()))('vendor-id');

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['message' => 'Vendor validated.', 'status' => 'active'], $this->decode($response));
    }

    private function makeDraftServiceForCreate(): AdminVendorDraftService
    {
        $service = $this->makeServiceEntity();
        $region = $this->makeRegion();

        $entityManager = $this->createStub(EntityManagerInterface::class);
        $entityManager->method('find')->willReturnCallback(
            fn(string $className, string $id): ?object => match ($className) {
                Service::class => $id === 'service-id' ? $service : null,
                Region::class => $id === 'region-id' ? $region : null,
                default => null,
            }
        );
        $entityManager->method('persist')->willReturnCallback(function (object $entity): void {
            if ($entity instanceof User || $entity instanceof Vendor) {
                $this->setPrivateProperty($entity, 'id', new UuidV7());
                $this->initTimestamps($entity);
            }
        });

        return $this->makeDraftService(entityManager: $entityManager);
    }

    private function makeDraftService(
        ?EntityManagerInterface $entityManager = null,
        ?InviteTokenRepository $inviteTokenRepository = null,
    ): AdminVendorDraftService {
        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->willReturn(null);

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');

        return new AdminVendorDraftService(
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $userRepository,
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $passwordHasher,
        );
    }

    private function makeInvitationService(
        ?InviteTokenRepository $inviteTokenRepository = null,
        ?EntityManagerInterface $entityManager = null,
        ?MailerInterface $mailer = null,
    ): AdminVendorInvitationService {
        return new AdminVendorInvitationService(
            $inviteTokenRepository ?? $this->createStub(InviteTokenRepository::class),
            $entityManager ?? $this->createStub(EntityManagerInterface::class),
            $mailer ?? $this->createStub(MailerInterface::class),
            'https://wedly.test',
        );
    }

    private function makeReviewService(int $flushCount = 1): AdminVendorReviewService
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->exactly($flushCount))->method('flush');

        return new AdminVendorReviewService(
            $entityManager,
            $this->createStub(EventDispatcherInterface::class),
            'https://wedly.test',
        );
    }

    private function makeSecurity(?object $user): Security
    {
        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($user);

        return $security;
    }

    private function makeAdmin(): User
    {
        $admin = (new User())
            ->setFirstName('Admin')
            ->setEmail('admin@example.fr')
            ->setPassword('password')
            ->setRoles(['ROLE_ADMIN']);
        $this->setPrivateProperty($admin, 'id', new UuidV7());
        $this->initTimestamps($admin);

        return $admin;
    }

    private function makeVendor(VendorStatus $status = VendorStatus::Pending): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setLastName('Martin')
            ->setEmail('camille@example.fr')
            ->setPassword('password')
            ->setRoles(['ROLE_VENDOR'])
            ->setStatus(UserStatus::Pending);
        $this->setPrivateProperty($user, 'id', new UuidV7());
        $this->initTimestamps($user);

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille')
            ->setStatus($status)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100000)
            ->setPriceMaxCents(250000)
            ->setSubmittedForReviewAt(new \DateTimeImmutable('2026-01-01T10:00:00+00:00'));
        $this->setPrivateProperty($vendor, 'id', new UuidV7());
        $this->initTimestamps($vendor);
        $vendor->addService($this->makeServiceEntity());
        $vendor->addRegion($this->makeRegion());

        return $vendor;
    }

    private function makeServiceEntity(): Service
    {
        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(1)
            ->setCategory(VendorType::Freelance);
        $this->setPrivateProperty($service, 'id', new UuidV7());
        $this->initTimestamps($service);

        return $service;
    }

    private function makeRegion(): Region
    {
        $region = (new Region())->setName('Île-de-France')->setSlug('ile-de-france');
        $this->setPrivateProperty($region, 'id', new UuidV7());
        $this->initTimestamps($region);

        return $region;
    }

    private function makeInviteToken(Vendor $vendor, string $token): InviteToken
    {
        $inviteToken = (new InviteToken())
            ->setToken($token)
            ->setPersona(InviteTokenPersona::Vendor)
            ->setStatus(InviteTokenStatus::Pending)
            ->setUser($vendor->getUser())
            ->setVendor($vendor)
            ->setExpiresAt(new \DateTimeImmutable('+10 days'));
        $this->setPrivateProperty($inviteToken, 'id', new UuidV7());
        $this->initTimestamps($inviteToken);

        return $inviteToken;
    }

    private function createPayload(): array
    {
        return [
            'firstname'  => 'Camille',
            'email'      => 'camille@example.fr',
            'brand_name' => 'Studio Camille',
            'service_id' => 'service-id',
            'regions'    => ['region-id'],
            'price_min'  => 100000,
            'price_max'  => 250000,
            'price_type' => PriceType::PerService->value,
        ];
    }

    private function decode(object $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function initTimestamps(object $entity): void
    {
        $now = new \DateTimeImmutable('2026-01-01T10:00:00+00:00');

        foreach (['createdAt', 'updatedAt'] as $property) {
            if (!property_exists($entity, $property)) {
                continue;
            }

            $this->setPrivateProperty($entity, $property, $now);
        }
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
