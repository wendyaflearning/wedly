<?php

declare(strict_types=1);

namespace App\Controller\Vendor\BookingBlocker;

use App\DTO\BookingBlocker\BookingBlockerResponseDto;
use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\User\User;
use App\Repository\BookingBlocker\BookingBlockerRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/booking-blockers', name: 'api_vendor_booking_blocker_list', methods: ['GET'])]
final class GetVendorBookingBlockerAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly BookingBlockerRepository $bookingBlockerRepository,
    ) {}

    public function __invoke(): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolve($user);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        $blockers = $this->bookingBlockerRepository->findByVendor($vendor);

        return new JsonResponse(
            array_map(fn(BookingBlocker $blocker) => new BookingBlockerResponseDto($blocker), $blockers)
        );
    }
}
