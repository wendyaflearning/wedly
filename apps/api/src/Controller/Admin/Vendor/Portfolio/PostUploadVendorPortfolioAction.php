<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor\Portfolio;

use App\DTO\Admin\Vendor\Portfolio\AdminPortfolioUploadRequestDto;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/v1/admin/vendors/{id}/portfolio', name: 'api_admin_vendor_portfolio_upload', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
final readonly class PostUploadVendorPortfolioAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private PortfolioService $portfolioService,
        private EntityManagerInterface $em,
    ) {}

    public function __invoke(string $id, Request $request): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if (null === $vendor) {
            return new JsonResponse(['error' => 'Prestataire introuvable.'], 404);
        }

        $dto = AdminPortfolioUploadRequestDto::fromRequest($request);

        $image = $this->portfolioService->uploadPhoto(
            $vendor,
            $dto->file,
            $dto->sortOrder,
            $dto->styleTags,
            $dto->specialtyTags,
        );

        $this->em->flush();

        return new JsonResponse([
            'id'        => $image->getId()->toRfc4122(),
            'url'       => $image->getUrl(),
            'sortOrder' => $image->getSortOrder(),
        ], 201);
    }
}
