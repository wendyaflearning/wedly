<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\ProviderLead;

use App\Assembler\Vendor\ProviderLead\VendorProviderLeadResponseDtoAssembler;
use App\Entity\User\User;
use App\Repository\ProviderLead\ProviderLeadRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Les demandes de mise en relation reçues par le prestataire connecté (WED-51).
 *
 * Même règle que côté couple : le prestataire vient du JWT, aucun identifiant ne
 * transite par l'URL, donc les demandes d'un autre prestataire ne sont pas
 * atteignables. Le 403 d'un compte sans fiche est levé par
 * `VendorOwnershipResolver` et mappé par l'ExceptionListener.
 */
#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/provider-leads', name: 'api_vendor_me_provider_leads_get', methods: ['GET'])]
final class GetVendorProviderLeadsAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly ProviderLeadRepository $providerLeadRepository,
        private readonly VendorProviderLeadResponseDtoAssembler $assembler,
    ) {}

    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $leads = $this->providerLeadRepository->findByVendor($vendor);

        return new JsonResponse(['items' => $this->assembler->assembleList($leads)]);
    }
}
