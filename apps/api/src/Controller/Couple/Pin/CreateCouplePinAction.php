<?php

declare(strict_types=1);

namespace App\Controller\Couple\Pin;

use App\DTO\Couple\Pin\CreateCouplePinRequestDto;
use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use App\Service\Couple\Pin\CreateCouplePinService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Épingler depuis Wedream sans repasser par l'onboarding (WED-155 / US3b).
 *
 * Même adresse que la lecture « Mes épinglés », même règle : le couple vient du
 * JWT, jamais de l'URL ni du corps, donc un compte ne peut épingler que pour
 * lui-même.
 *
 * Aucun try/catch ici — la photo refusée par VendorResolver (422) et l'échec
 * d'unicité traité dans le service remontent tels quels à l'ExceptionListener,
 * seul endroit où le mapping HTTP est décidé.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route('/api/v1/couples/me/pins', name: 'api_couple_me_pins_create', methods: ['POST'])]
final class CreateCouplePinAction extends AbstractController
{
    public function __construct(
        private readonly Security                $security,
        private readonly CoupleRepository        $coupleRepository,
        private readonly CreateCouplePinService  $createCouplePinService,
    ) {}

    public function __invoke(#[MapRequestPayload] CreateCouplePinRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $couple = $this->coupleRepository->findOneByUser($user);

        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        $this->createCouplePinService->create($couple, $dto->portfolioImageId);

        return new JsonResponse(['success' => true], 201);
    }
}
