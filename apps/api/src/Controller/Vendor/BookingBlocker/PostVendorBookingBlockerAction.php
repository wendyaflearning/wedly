<?php

declare(strict_types=1);

namespace App\Controller\Vendor\BookingBlocker;

use App\DTO\BookingBlocker\BookingBlockerRequestDto;
use App\DTO\BookingBlocker\BookingBlockerResponseDto;
use App\Entity\User\User;
use App\Service\BookingBlocker\BookingBlockerService;
use App\Service\Vendor\VendorOwnershipResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/booking-blockers', name: 'api_vendor_booking_blocker_create', methods: ['POST'])]
final class PostVendorBookingBlockerAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly BookingBlockerService $bookingBlockerService,
    ) {}

    public function __invoke(#[MapRequestPayload] BookingBlockerRequestDto $dto): JsonResponse
    {
        try {
            /** @var User $user */
            $user    = $this->security->getUser();
            $vendor  = $this->vendorOwnershipResolver->resolve($user);
            $blocker = $this->bookingBlockerService->create($vendor, $dto->date_start, $dto->date_end);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        return new JsonResponse(new BookingBlockerResponseDto($blocker), 201);
    }
}
