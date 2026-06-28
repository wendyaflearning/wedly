<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\DTO\Vendor\Dashboard\PortfolioImageResponseDto;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/portfolio', name: 'api_vendor_dashboard_portfolio_get', methods: ['GET'])]
final class GetVendorDashboardPortfolioAction extends AbstractController
{
    public function __construct(
        private readonly Security                  $security,
        private readonly VendorOwnershipResolver   $vendorOwnershipResolver,
        private readonly PortfolioImageRepository  $portfolioImageRepository,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolve($user);

            if ($vendor->getId()->toRfc4122() !== $id) {
                return new JsonResponse(['error' => 'Accès interdit.'], 403);
            }

            $images = $this->portfolioImageRepository->findByVendor($vendor);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(
            array_map(fn(PortfolioImage $image) => new PortfolioImageResponseDto($image), $images),
        );
    }
}
