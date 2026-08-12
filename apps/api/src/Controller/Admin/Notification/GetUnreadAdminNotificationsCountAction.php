<?php

declare(strict_types=1);

namespace App\Controller\Admin\Notification;

use App\Entity\User\User;
use App\Service\Admin\AdminNotificationService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/notifications/unread-count', name: 'api_admin_notification_unread_count', methods: ['GET'])]
final readonly class GetUnreadAdminNotificationsCountAction
{
    public function __construct(
        private Security $security,
        private AdminNotificationService $notificationService,
    ) {}

    public function __invoke(): JsonResponse
    {
        $admin = $this->security->getUser();
        if (!$admin instanceof User) {
            return new JsonResponse(['error' => 'Administrateur introuvable.'], 404);
        }

        return new JsonResponse($this->notificationService->unreadCountForAdmin($admin));
    }
}
