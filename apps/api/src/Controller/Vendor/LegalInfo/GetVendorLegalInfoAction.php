<?php

declare(strict_types=1);

namespace App\Controller\Vendor\LegalInfo;

use App\Handler\Vendor\Onboarding\LegalInfoStepHandler;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/vendors/{id}/legal-info', name: 'api_vendor_legal_info_get', methods: ['GET'])]
final class GetVendorLegalInfoAction extends AbstractController
{
    public function __construct(
        private readonly VendorRepository $vendorRepository,
        private readonly LegalInfoStepHandler $handler,
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
