<?php

declare(strict_types=1);

namespace App\Controller\Admin\Notification;

use App\Entity\User\User;
use App\Service\Admin\AdminNotificationService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/notifications', name: 'api_admin_notification_list', methods: ['GET'])]
final readonly class ListAdminNotificationsAction
{
    public function __construct(
        private Security $security,
        private AdminNotificationService $notificationService,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $admin = $this->security->getUser();
        if (!$admin instanceof User) {
            return new JsonResponse(['error' => 'Administrateur introuvable.'], 404);
        }

        return new JsonResponse($this->notificationService->listForAdmin(
            $admin,
            $request->query->getInt('page', 1),
            $request->query->getInt('limit', 10),
        ));
    }
}
