<?php

declare(strict_types=1);

namespace App\Controller\Couple;

use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Session projection for Mon espace Wedly (WED-133 / US-6.4).
 *
 * Mirrors admin/me and vendors/me/dashboard: the shell needs a greeting and
 * account menu without pulling business data from the zone endpoints.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route('/api/v1/couples/me', name: 'api_couple_me_get', methods: ['GET'])]
final readonly class GetCoupleMeAction
{
    public function __construct(
        private Security $security,
        private CoupleRepository $coupleRepository,
    ) {}

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['error' => 'Unauthorized.'], 401);
        }

        $couple = $this->coupleRepository->findOneByUser($user);
        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        return new JsonResponse([
            'id'        => $couple->getId()->toRfc4122(),
            'firstName' => $user->getFirstName(),
            'lastName'  => $user->getLastName(),
            'email'     => $user->getEmail(),
        ]);
    }
}
