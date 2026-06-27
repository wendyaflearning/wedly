<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Dashboard;

use App\DTO\Vendor\VendorDashboardResponseDto;
use App\Entity\User\User;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/dashboard', name: 'api_vendor_dashboard_get', methods: ['GET'])]
final class GetVendorDashboardAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
    ) {}

    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorRepository->findOneByUser($user);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'No vendor associated with this account.'], 403);
        }

        $steps = [
            'availability' => $this->vendorRepository->countBookingBlockersByVendor($vendor) > 0,
            'portfolio'    => $this->vendorRepository->countPortfolioImagesByVendor($vendor) >= 10,
            'bio'          => $vendor->getBio() !== null && trim($vendor->getBio()) !== '',
            'published'    => $vendor->isPublished(),
        ];

        $vendorServices = $vendor->resolveVendorServices();

        return new JsonResponse(new VendorDashboardResponseDto(
            $vendor->getId()->toRfc4122(),
            $user->getFirstName(),
            $user->getLastName(),
            $user->getEmail(),
            $vendor->getCreatedAt(),
            $steps,
            $vendor->getBio(),
            $vendorServices,
        ));
    }
}
