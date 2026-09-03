<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\DTO\Vendor\CreateVendorInputDto;
use App\Service\Vendor\AdminVendorDraftService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Aucun try/catch ici : le mapping HTTP des DomainException appartient à
 * `ExceptionListener`, qui faisait déjà exactement ce que ce catch refaisait.
 * Le garder ferait en plus perdre le `code` machine que l'ExceptionListener
 * ajoute sur un email déjà utilisé (WED-162), puisqu'il ne recopiait que le
 * message et le statut.
 */
#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors', name: 'api_admin_vendor_create', methods: ['POST'])]
final readonly class CreateVendorAction
{
    public function __construct(
        private AdminVendorDraftService $draftService,
    ) {}

    public function __invoke(#[MapRequestPayload] CreateVendorInputDto $dto): JsonResponse
    {
        return new JsonResponse(
            $this->draftService->create(new AdminVendorDraftRequestDto(
                firstname:               $dto->firstname,
                lastName:                null,
                email:                   $dto->email,
                brandName:               $dto->brand_name,
                serviceId:               $dto->service_id,
                regions:                 $dto->regions,
                priceMin:                $dto->price_min,
                priceMax:                $dto->price_max,
                priceType:               $dto->price_type->value,
                experiences:             null,
                legalInfo:               null,
                venueCharacteristics:    null,
                cateringCharacteristics: null,
            )),
            201
        );
    }
}
