<?php

declare(strict_types=1);

namespace App\Controller\Couple\ProviderLead;

use App\DTO\Couple\ProviderLead\CreateCoupleProviderLeadRequestDto;
use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use App\Service\Couple\ProviderLead\CreateCoupleProviderLeadService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contacter un prestataire depuis Wedream sans repasser par l'onboarding
 * (WED-156 / US3c).
 *
 * Même adresse que la lecture « Mes demandes », même règle : le couple vient du
 * JWT, jamais de l'URL ni du corps, donc un compte ne peut demander une mise en
 * relation que pour lui-même.
 *
 * 201 quand la demande est créée, 200 quand ce prestataire était déjà contacté :
 * le geste a abouti dans les deux cas, seul le fait qu'une ressource soit née
 * les distingue. C'est le service qui le sait, l'Action ne fait que le traduire.
 *
 * Aucun try/catch ici — la photo refusée par VendorResolver (422) et l'échec
 * d'unicité traité dans le service remontent tels quels à l'ExceptionListener,
 * seul endroit où le mapping HTTP est décidé.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route('/api/v1/couples/me/provider-leads', name: 'api_couple_me_provider_leads_create', methods: ['POST'])]
final class CreateCoupleProviderLeadAction extends AbstractController
{
    public function __construct(
        private readonly Security                        $security,
        private readonly CoupleRepository                $coupleRepository,
        private readonly CreateCoupleProviderLeadService $createCoupleProviderLeadService,
    ) {}

    public function __invoke(#[MapRequestPayload] CreateCoupleProviderLeadRequestDto $dto): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $couple = $this->coupleRepository->findOneByUser($user);

        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        $created = $this->createCoupleProviderLeadService->create($couple, $dto->portfolioImageId);

        return new JsonResponse(['success' => true], $created ? 201 : 200);
    }
}
