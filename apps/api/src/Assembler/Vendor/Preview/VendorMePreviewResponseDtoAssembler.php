<?php

declare(strict_types=1);

namespace App\Assembler\Vendor\Preview;

use App\DTO\BookingBlocker\BookingBlockerResponseDto;
use App\DTO\Vendor\Dashboard\PortfolioImageResponseDto;
use App\DTO\Vendor\Preview\VendorMePreviewResponseDto;
use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\Region\Region;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorProfileCompletionService;

final readonly class VendorMePreviewResponseDtoAssembler
{
    public function __construct(
        private VendorRepository               $vendorRepository,
        private VendorProfileCompletionService $completionService,
    ) {}

    public function assemble(Vendor $vendor): VendorMePreviewResponseDto
    {
        $bookingBlockers = $this->vendorRepository->findBookingBlockersByVendor($vendor);

        return new VendorMePreviewResponseDto(
            id:              $vendor->getId()->toRfc4122(),
            brandName:       $vendor->getBrandName(),
            bio:             $vendor->getBio(),
            vendorType:      $vendor->resolveVendorType()->value,
            services:        $vendor->resolveVendorServices(),
            styles:          array_map(fn(WeddingStyle $style) => $style->getSlug(), $vendor->getStyles()->toArray()),
            portfolioImages: array_map(fn(PortfolioImage $image) => new PortfolioImageResponseDto($image), $vendor->getPortfolioImages()->toArray()),
            bookingBlockers: array_map(fn(BookingBlocker $blocker) => new BookingBlockerResponseDto($blocker), $bookingBlockers),
            zones:           array_map(fn(Region $region) => [
                'id'   => $region->getId()->toRfc4122(),
                'name' => $region->getName(),
            ], $vendor->getRegions()->toArray()),
            priceMinCents:   $vendor->getPriceMinCents(),
            priceMaxCents:   $vendor->getPriceMaxCents(),
            priceType:       $vendor->getPriceType()->value,
            completion:      $this->completionService->checkForPublish($vendor),
            isPublished:     $vendor->isPublished(),
        );
    }
}
