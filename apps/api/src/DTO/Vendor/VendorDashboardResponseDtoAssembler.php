<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorType;
use App\Repository\Vendor\VendorRepository;

final readonly class VendorDashboardResponseDtoAssembler
{
    public function __construct(
        private VendorRepository $vendorRepository,
    ) {}

    public function assemble(Vendor $vendor, User $user): VendorDashboardResponseDto
    {
        $portfolioCount      = $this->vendorRepository->countPortfolioImagesByVendor($vendor);
        $bookingBlockerCount = $this->vendorRepository->countBookingBlockersByVendor($vendor);

        $sectionsStatus = [
            'general_info'    => $vendor->getSiret() !== null,
            'pricing_zone'    => !$vendor->getRegions()->isEmpty(),
            'experiences'     => $vendor->resolveVendorType() === VendorType::Lieu
                || (!$vendor->getConfessions()->isEmpty() && !$vendor->getCultures()->isEmpty()),
            'bio'             => $vendor->getBio() !== null && trim($vendor->getBio()) !== '',
            'portfolio'       => $portfolioCount > 0,
            'booking_blocker' => $bookingBlockerCount > 0,
        ];

        return new VendorDashboardResponseDto(
            id:                      $vendor->getId()->toRfc4122(),
            firstName:               $user->getFirstName(),
            lastName:                $user->getLastName(),
            email:                   $user->getEmail(),
            status:                  $vendor->getStatus()->value,
            createdAt:               $vendor->getCreatedAt(),
            vendorType:              $vendor->resolveVendorType()->value,
            sectionsStatus:          $sectionsStatus,
            portfolioPhotosCount:    $portfolioCount,
            portfolioHasCover:       $this->vendorRepository->hasPortfolioCoverByVendor($vendor),
            bookingBlockersCount:    $bookingBlockerCount,
            bookingBlockersUpdatedAt: $this->vendorRepository->findLatestBookingBlockerUpdatedAt($vendor),
            bio:                     $vendor->getBio(),
            vendorServices:          $vendor->resolveVendorServices(),
        );
    }
}
