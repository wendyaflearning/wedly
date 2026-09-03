<?php

declare(strict_types=1);

namespace App\Controller\Couple\Pin;

use App\Assembler\Couple\Pin\CouplePinResponseDtoAssembler;
use App\Repository\Couple\CouplePinRepository;
use App\Service\Couple\CoupleFromJwtResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * « Mes épinglés » in Mon espace Wedly (WED-132 / US-6.2).
 *
 * The couple is always read from the JWT: no couple id in the URL, so one
 * account cannot reach another couple's pins.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route('/api/v1/couples/me/pins', name: 'api_couple_me_pins_get', methods: ['GET'])]
final class GetCouplePinsAction extends AbstractController
{
    public function __construct(
        private readonly CoupleFromJwtResolver           $coupleResolver,
        private readonly CouplePinRepository             $couplePinRepository,
        private readonly CouplePinResponseDtoAssembler   $assembler,
    ) {}

    public function __invoke(): JsonResponse
    {
        $couple = $this->coupleResolver->resolve();

        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        $pins = $this->couplePinRepository->findByCouple($couple);

        return new JsonResponse(['items' => $this->assembler->assembleList($pins)]);
    }
}
