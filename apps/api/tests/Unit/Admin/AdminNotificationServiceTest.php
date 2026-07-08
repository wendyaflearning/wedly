<?php

declare(strict_types=1);

namespace App\Tests\Unit\Admin;

use App\Entity\Admin\AdminNotification;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Admin\AdminNotificationType;
use App\Enum\User\Role;
use App\Repository\Admin\AdminNotificationRepository;
use App\Repository\User\UserRepository;
use App\Service\Admin\AdminNotificationService;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class AdminNotificationServiceTest extends TestCase
{
    public function test_create_provider_pending_review_notifications_persists_one_notification_per_admin(): void
    {
        $provider = $this->makeVendor();
        $adminA = $this->makeAdmin('alice@example.fr');
        $adminB = $this->makeAdmin('bob@example.fr');

        $repository = $this->createMock(AdminNotificationRepository::class);
        $repository->expects($this->exactly(2))
            ->method('hasUnreadForRecipientAndProvider')
            ->willReturn(false);

        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findAdmins')->willReturn([$adminA, $adminB]);

        $persisted = [];
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))
            ->method('persist')
            ->with($this->callback(function (AdminNotification $notification) use (&$persisted, $provider): bool {
                $persisted[] = $notification;

                self::assertSame($provider, $notification->getProvider());
                self::assertSame(AdminNotificationType::ProviderPendingReview, $notification->getType());
                self::assertSame('Studio Camille', $notification->getPayload()['provider_name']);
                self::assertSame('Traiteur', $notification->getPayload()['provider_category']);
                self::assertSame($provider->getId()->toRfc4122(), $notification->getPayload()['provider_id']);

                return true;
            }));
        $em->expects($this->once())->method('flush');

        $service = new AdminNotificationService($em, $repository, $userRepository);
        $service->createProviderPendingReviewNotifications($provider);

        self::assertCount(2, $persisted);
    }

    public function test_create_provider_pending_review_notifications_skips_existing_unread_duplicates(): void
    {
        $provider = $this->makeVendor();
        $admin = $this->makeAdmin('alice@example.fr');

        $repository = $this->createMock(AdminNotificationRepository::class);
        $repository->expects($this->once())
            ->method('hasUnreadForRecipientAndProvider')
            ->willReturn(true);

        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findAdmins')->willReturn([$admin]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('persist');
        $em->expects($this->once())->method('flush');

        $service = new AdminNotificationService($em, $repository, $userRepository);
        $service->createProviderPendingReviewNotifications($provider);
    }

    public function test_mark_as_read_rejects_notification_owned_by_another_admin(): void
    {
        $owner = $this->makeAdmin('owner@example.fr');
        $reader = $this->makeAdmin('reader@example.fr');
        $notification = (new AdminNotification())
            ->setRecipient($owner)
            ->setProvider($this->makeVendor())
            ->setType(AdminNotificationType::ProviderPendingReview)
            ->setPayload([]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $service = new AdminNotificationService(
            $em,
            $this->createStub(AdminNotificationRepository::class),
            $this->createStub(UserRepository::class),
        );

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Notification introuvable.');

        $service->markAsRead($notification, $reader);
    }

    private function makeAdmin(string $email): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setFirstName('Admin')
            ->setPassword('hashed')
            ->setRoles([Role::Admin->value]);

        $this->setPrivateProperty($user, 'id', new UuidV7());

        return $user;
    }

    private function makeVendor(): Vendor
    {
        $vendor = (new Vendor())
            ->setUser($this->makeAdmin('vendor-owner@example.fr'))
            ->setBrandName('Studio Camille')
            ->setSubmittedForReviewAt(new \DateTimeImmutable('2026-07-08T10:00:00+00:00'));

        $service = (new Service())
            ->setName('Traiteur premium')
            ->setSlug('traiteur')
            ->setSortOrder(1)
            ->setCategory(\App\Enum\Vendor\VendorType::Traiteur);

        $this->setPrivateProperty($vendor, 'id', new UuidV7());
        $this->setPrivateProperty($service, 'id', new UuidV7());
        $this->setPrivateProperty($vendor, 'services', new ArrayCollection([$service]));

        return $vendor;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
