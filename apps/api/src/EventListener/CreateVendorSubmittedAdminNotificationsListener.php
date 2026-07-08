<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\VendorSubmittedForReviewEvent;
use App\Service\Admin\AdminNotificationService;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener]
final readonly class CreateVendorSubmittedAdminNotificationsListener
{
    public function __construct(private AdminNotificationService $notificationService) {}

    public function __invoke(VendorSubmittedForReviewEvent $event): void
    {
        $this->notificationService->createProviderPendingReviewNotifications($event->vendor);
    }
}
