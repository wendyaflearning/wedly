<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Availability;

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
#[Route('/api/v1/vendors/{id}/availability', name: 'api_vendor_availability_list', methods: ['GET'])]
final class GetVendorAvailabilityAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorOwnershipResolver $vendorOwnershipResolver,
        private readonly BookingBlockerRepository $bookingBlockerRepository,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->vendorOwnershipResolver->resolve($user, $id);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }

        $blockers = $this->bookingBlockerRepository->findByVendor($vendor);

        return new JsonResponse(
            array_map(fn(BookingBlocker $blocker) => new BookingBlockerResponseDto($blocker), $blockers)
        );
    }
}
