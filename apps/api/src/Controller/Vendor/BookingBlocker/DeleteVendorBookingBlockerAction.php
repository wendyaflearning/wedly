<?php

declare(strict_types=1);

namespace App\Controller\Vendor\BookingBlocker;

use App\Entity\User\User;
use App\Service\BookingBlocker\BookingBlockerService;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/booking-blockers/{blockerId}', name: 'api_vendor_booking_blocker_delete', methods: ['DELETE'])]
final class DeleteVendorBookingBlockerAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly BookingBlockerService $bookingBlockerService,
    ) {}

    public function __invoke(string $blockerId): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolveActive($user);
            $this->bookingBlockerService->delete($vendor, $blockerId);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
