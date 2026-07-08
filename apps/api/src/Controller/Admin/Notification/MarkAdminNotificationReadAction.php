<?php

declare(strict_types=1);

namespace App\Controller\Admin\Notification;

use App\Entity\Admin\AdminNotification;
use App\Entity\User\User;
use App\Service\Admin\AdminNotificationService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/notifications/{id}/read', name: 'api_admin_notification_mark_read', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
final readonly class MarkAdminNotificationReadAction
{
    public function __construct(
        private Security $security,
        private AdminNotificationService $notificationService,
    ) {}

    public function __invoke(AdminNotification $notification): JsonResponse
    {
        $admin = $this->security->getUser();
        if (!$admin instanceof User) {
            return new JsonResponse(['error' => 'Administrateur introuvable.'], 404);
        }

        $this->notificationService->markAsRead($notification, $admin);

        return new JsonResponse(null, 204);
    }
}
