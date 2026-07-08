<?php

declare(strict_types=1);

namespace App\Service\Admin;

use App\DTO\Admin\Vendor\AdminVendorListItemResponseDto;
use App\Entity\Admin\AdminNotification;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Admin\AdminNotificationType;
use App\Enum\User\Role;
use App\Repository\Admin\AdminNotificationRepository;
use App\Repository\User\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

final readonly class AdminNotificationService
{
    private const MAX_LIMIT = 50;

    public function __construct(
        private EntityManagerInterface $em,
        private AdminNotificationRepository $notificationRepository,
        private UserRepository $userRepository,
    ) {}

    public function createProviderPendingReviewNotifications(Vendor $provider): void
    {
        foreach ($this->userRepository->findAdmins() as $admin) {
            if ($this->notificationRepository->hasUnreadForRecipientAndProvider(
                $admin,
                $provider,
                AdminNotificationType::ProviderPendingReview,
            )) {
                continue;
            }

            $notification = (new AdminNotification())
                ->setRecipient($admin)
                ->setProvider($provider)
                ->setType(AdminNotificationType::ProviderPendingReview)
                ->setPayload($this->buildProviderPendingReviewPayload($provider));

            $this->em->persist($notification);
        }

        $this->em->flush();
    }

    public function listForAdmin(User $admin, int $page, int $limit): array
    {
        $page = max(1, $page);
        $limit = min(self::MAX_LIMIT, max(1, $limit));
        $offset = ($page - 1) * $limit;

        return [
            'items' => array_map(
                fn(AdminNotification $notification) => $this->serializeNotification($notification),
                $this->notificationRepository->findLatestForRecipient($admin, $limit, $offset),
            ),
            'page' => $page,
            'limit' => $limit,
            'total' => $this->notificationRepository->countForRecipient($admin),
            'unread_count' => $this->notificationRepository->countUnreadForRecipient($admin),
        ];
    }

    public function unreadCountForAdmin(User $admin): array
    {
        return ['unread_count' => $this->notificationRepository->countUnreadForRecipient($admin)];
    }

    public function markAsRead(AdminNotification $notification, User $admin): void
    {
        if (!$notification->getRecipient()->getId()->equals($admin->getId())) {
            throw new \DomainException('Notification introuvable.', 404);
        }

        if ($notification->isRead()) {
            return;
        }

        $notification->markAsRead();
        $this->em->flush();
    }

    private function buildProviderPendingReviewPayload(Vendor $provider): array
    {
        $vendorType = $provider->resolveVendorType();
        $submittedAt = $provider->getSubmittedForReviewAt() ?? $provider->getUpdatedAt();

        return [
            'provider_id' => $provider->getId()->toRfc4122(),
            'provider_name' => $provider->getBrandName(),
            'provider_category' => AdminVendorListItemResponseDto::vendorTypeLabel($vendorType),
            'submitted_at' => $submittedAt->format(\DateTimeInterface::ATOM),
            'recipient_role' => Role::Admin->value,
        ];
    }

    private function serializeNotification(AdminNotification $notification): array
    {
        return [
            'id' => $notification->getId()->toRfc4122(),
            'type' => $notification->getType()->value,
            'type_label' => $notification->getType()->label(),
            'payload' => $notification->getPayload(),
            'is_read' => $notification->isRead(),
            'read_at' => $notification->getReadAt()?->format(\DateTimeInterface::ATOM),
            'created_at' => $notification->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
