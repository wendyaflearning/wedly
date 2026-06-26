<?php

declare(strict_types=1);

namespace App\Controller\Vendor\VenueCharacteristics;

use App\Handler\Vendor\Onboarding\VenueCharacteristicsStepHandler;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/vendors/{id}/venue-characteristics', name: 'api_vendor_venue_characteristics_get', methods: ['GET'])]
final class GetVendorVenueCharacteristicsAction extends AbstractController
{
    public function __construct(
        private readonly VendorRepository $vendorRepository,
        private readonly VenueCharacteristicsStepHandler $handler,
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
