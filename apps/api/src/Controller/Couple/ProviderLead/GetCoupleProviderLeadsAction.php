<?php

declare(strict_types=1);

namespace App\Controller\Couple\ProviderLead;

use App\Assembler\Couple\ProviderLead\CoupleProviderLeadResponseDtoAssembler;
use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use App\Repository\ProviderLead\ProviderLeadRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Zone « Demandes de contact » de Mon espace Wedly (WED-131 / US-6.1).
 *
 * Le couple lu est toujours celui du JWT : aucun identifiant de couple ne
 * transite par l'URL, donc aucune demande d'un autre couple n'est atteignable.
 */
#[IsGranted('ROLE_COUPLE')]
#[Route('/api/v1/couples/me/provider-leads', name: 'api_couple_me_provider_leads_get', methods: ['GET'])]
final class GetCoupleProviderLeadsAction extends AbstractController
{
    public function __construct(
        private readonly Security                               $security,
        private readonly CoupleRepository                       $coupleRepository,
        private readonly ProviderLeadRepository                 $providerLeadRepository,
        private readonly CoupleProviderLeadResponseDtoAssembler $assembler,
    ) {}

    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $couple = $this->coupleRepository->findOneByUser($user);

        if ($couple === null) {
            return new JsonResponse(['error' => 'No couple associated with this account.'], 404);
        }

        $leads = $this->providerLeadRepository->findByCouple($couple);

        return new JsonResponse(['items' => $this->assembler->assembleList($leads)]);
    }
}
