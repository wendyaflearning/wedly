<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/me', name: 'api_admin_me', methods: ['GET'])]
final readonly class GetCurrentAdminAction
{
    public function __construct(private Security $security) {}

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Administrateur introuvable.'], 404);
        }

        return new JsonResponse([
            'email'      => $user->getEmail(),
            'first_name' => $user->getFirstName(),
            'last_name'  => $user->getLastName(),
            'roles'      => $user->getRoles(),
        ]);
    }
}
