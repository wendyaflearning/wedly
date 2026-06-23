<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard\Portfolio;

use App\DTO\Vendor\Dashboard\PortfolioImageResponseDto;
use App\Entity\User\User;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/portfolio', name: 'api_vendor_dashboard_portfolio_post', methods: ['POST'])]
final class PostVendorDashboardPortfolioAction extends AbstractController
{
    public function __construct(
        private readonly Security                $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly PortfolioService        $portfolioService,
        private readonly EntityManagerInterface  $em,
    ) {}

    public function __invoke(string $id, Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolve($user);

            if ($vendor->getId()->toRfc4122() !== $id) {
                return new JsonResponse(['error' => 'Accès interdit.'], 403);
            }

            $file = $request->files->get('file');
            if ($file === null) {
                return new JsonResponse(['error' => 'Le champ "file" est requis.'], 422);
            }

            $image = $this->portfolioService->uploadPhoto($vendor, $file);
            $this->em->flush();
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(new PortfolioImageResponseDto($image), 201);
    }
}
