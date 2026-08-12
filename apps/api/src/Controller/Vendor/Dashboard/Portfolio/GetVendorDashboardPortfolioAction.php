<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\DTO\Vendor\Dashboard\PortfolioImageResponseDto;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/portfolio', name: 'api_vendor_dashboard_portfolio_get', methods: ['GET'])]
final readonly class GetVendorDashboardPortfolioAction
{
    public function __construct(
        private Security                  $security,
        private VendorOwnershipResolver   $vendorOwnershipResolver,
        private PortfolioImageRepository  $portfolioImageRepository,
    ) {}

    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $images = $this->portfolioImageRepository->findByVendor($vendor);

        return new JsonResponse(
            array_map(fn(PortfolioImage $image) => new PortfolioImageResponseDto($image), $images),
        );
    }
}
