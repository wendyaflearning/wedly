<?php

declare(strict_types=1);

namespace App\Controller\Couple\Pin;

use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use App\Service\Couple\Pin\DeleteCouplePinService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Dé-épingler une photo depuis Wedream (WED-183 / US3b).
 *
 * Même adresse et même règle que les deux autres endpoints « pins » : le couple
 * vient du JWT, jamais de l'URL, donc un compte ne peut dé-épingler que pour
 * lui-même. La photo est le seul paramètre d'URL, contrainte au format UUID pour
 * qu'un identifiant malformé n'atteigne jamais la couche Doctrine.
 *
 * Aucun try/catch ici — l'imprévu remonte à l'ExceptionListener, seul endroit où
 * le mapping HTTP est décidé.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route(
    '/api/v1/couples/me/pins/{portfolioImageId}',
    name: 'api_couple_me_pins_delete',
    requirements: ['portfolioImageId' => '[0-9a-fA-F-]{36}'],
    methods: ['DELETE'],
)]
final class DeleteCouplePinAction extends AbstractController
{
    public function __construct(
        private readonly Security               $security,
        private readonly CoupleRepository       $coupleRepository,
        private readonly DeleteCouplePinService $deleteCouplePinService,
    ) {}

    public function __invoke(string $portfolioImageId): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $couple = $this->coupleRepository->findOneByUser($user);

        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        $this->deleteCouplePinService->delete($couple, $portfolioImageId);

        return new JsonResponse(null, 204);
    }
}
