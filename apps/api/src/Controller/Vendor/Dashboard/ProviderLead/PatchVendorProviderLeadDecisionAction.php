<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\ProviderLead;

use App\Assembler\Vendor\ProviderLead\VendorProviderLeadResponseDtoAssembler;
use App\DTO\Vendor\ProviderLead\VendorProviderLeadDecisionRequestDto;
use App\Entity\User\User;
use App\Service\Vendor\ProviderLead\DecideVendorProviderLeadService;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Le prestataire accepte ou refuse une demande de mise en relation (WED-51).
 *
 * Le prestataire vient du JWT, le lead de l'URL : c'est le service qui vérifie
 * que l'un appartient à l'autre, et il renvoie le même 404 pour une demande
 * inexistante et pour celle d'un confrère.
 *
 * La réponse renvoie la demande telle qu'elle se lit désormais — après une
 * acceptation, la forme débloquée avec les coordonnées du couple. L'écran n'a
 * donc pas à relancer un GET pour afficher ce qu'il vient de débloquer.
 *
 * Aucun try/catch : les \DomainException du service (404, 409) remontent à
 * l'ExceptionListener, seul endroit où le mapping HTTP est décidé.
 */
#[IsGranted('ROLE_VENDOR')]
#[Route(
    '/api/v1/vendors/me/provider-leads/{id}',
    name: 'api_vendor_me_provider_leads_decide',
    methods: ['PATCH'],
)]
final class PatchVendorProviderLeadDecisionAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly DecideVendorProviderLeadService $decideVendorProviderLeadService,
        private readonly VendorProviderLeadResponseDtoAssembler $assembler,
    ) {}

    public function __invoke(
        string $id,
        #[MapRequestPayload] VendorProviderLeadDecisionRequestDto $dto,
    ): JsonResponse {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $lead = $this->decideVendorProviderLeadService->decide($vendor, $id, $dto->decision);

        return new JsonResponse($this->assembler->assemble($lead));
    }
}
