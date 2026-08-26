<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\DTO\Vendor\Dashboard\PortfolioImageResponseDto;
use App\Entity\User\User;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/portfolio', name: 'api_vendor_dashboard_portfolio_post', methods: ['POST'])]
final readonly class PostVendorDashboardPortfolioAction
{
    public function __construct(
        private Security                $security,
        private VendorOwnershipResolver $vendorOwnershipResolver,
        private PortfolioService        $portfolioService,
        private EntityManagerInterface  $em,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorOwnershipResolver->resolve($user);

        $file = $request->files->get('file');
        if ($file === null) {
            return new JsonResponse(['error' => 'Le champ "file" est requis.'], 422);
        }

        $image = $this->portfolioService->uploadPhoto($vendor, $file);
        $this->em->flush();

        return new JsonResponse(new PortfolioImageResponseDto($image), 201);
    }
}
