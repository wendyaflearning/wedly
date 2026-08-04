<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\Portfolio;

use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}/portfolio/{imageId}', name: 'api_admin_vendor_portfolio_delete', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['DELETE'])]
final readonly class DeleteVendorPortfolioAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private PortfolioImageRepository $portfolioImageRepository,
        private PortfolioService $portfolioService,
        private EntityManagerInterface $em,
    ) {}

    public function __invoke(string $id, string $imageId): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if (null === $vendor) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        $image = $this->portfolioImageRepository->findOneBy([
            'id'     => $imageId,
            'vendor' => $vendor,
        ]);

        if (null === $image) {
            return new JsonResponse(['error' => 'Image introuvable.'], 404);
        }

        $publicId = $this->portfolioService->deletePhoto($image);
        $this->em->flush();
        $this->portfolioService->destroyCloudinaryAsset($publicId);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
