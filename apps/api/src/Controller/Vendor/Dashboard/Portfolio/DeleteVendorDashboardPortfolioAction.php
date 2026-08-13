<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\Entity\User\User;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route(
    '/api/v1/vendors/me/portfolio/{photoId}',
    name: 'api_vendor_dashboard_portfolio_delete',
    requirements: ['photoId' => '[0-9a-fA-F-]{36}'],
    methods: ['DELETE'],
)]
final readonly class DeleteVendorDashboardPortfolioAction
{
    public function __construct(
        private Security                  $security,
        private VendorOwnershipResolver  $vendorOwnershipResolver,
        private PortfolioImageRepository  $portfolioImageRepository,
        private PortfolioService          $portfolioService,
        private EntityManagerInterface    $em,
    ) {}

    public function __invoke(string $photoId): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $image = $this->portfolioImageRepository->findOneBy([
            'id'     => $photoId,
            'vendor' => $vendor,
        ]);

        if ($image === null) {
            return new JsonResponse(['error' => 'Image introuvable.'], 404);
        }

        $publicId = $this->portfolioService->deletePhoto($image);
        $this->em->flush();
        $this->portfolioService->destroyCloudinaryAsset($publicId);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
