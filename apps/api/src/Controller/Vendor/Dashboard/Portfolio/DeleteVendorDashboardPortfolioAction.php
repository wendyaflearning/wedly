<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\Entity\User\User;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/portfolio/{photoId}', name: 'api_vendor_dashboard_portfolio_delete', methods: ['DELETE'])]
final class DeleteVendorDashboardPortfolioAction extends AbstractController
{
    public function __construct(
        private readonly Security                  $security,
        private readonly VendorOwnershipResolver  $vendorOwnershipResolver,
        private readonly PortfolioImageRepository  $portfolioImageRepository,
        private readonly PortfolioService          $portfolioService,
        private readonly EntityManagerInterface    $em,
    ) {}

    public function __invoke(string $id, string $photoId): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolve($user);

            if ($vendor->getId()->toRfc4122() !== $id) {
                return new JsonResponse(['error' => 'Accès interdit.'], 403);
            }

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
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
