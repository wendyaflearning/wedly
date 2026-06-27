<?php

declare(strict_types=1);

namespace App\Controller\Vendor\PricingZone;

use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/vendors/{id}/zone-pricing', name: 'api_vendor_zone_pricing_get', methods: ['GET'])]
final class GetVendorPricingZoneAction extends AbstractController
{
    public function __construct(
        private readonly VendorRepository $vendorRepository,
        private readonly ZonesPricingStepHandler $handler,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        return new JsonResponse($this->handler->getStepData($vendor));
    }
}
