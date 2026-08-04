<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Repository\Vendor\VendorRepository;

final readonly class VendorProfileCompletionService
{
    public function __construct(
        private VendorRepository        $vendorRepository,
        private PortfolioStepHandler    $portfolioStepHandler,
        private ZonesPricingStepHandler $zonesPricingStepHandler,
    ) {}

    /** @return array{bio: bool, styles: bool, portfolio: bool, disponibilites: bool, zone: bool, tarifs: bool} */
    public function check(Vendor $vendor, ?array $preloadedBookingBlockers = null): array
    {
        $zonesAndTarifsFilled = $this->zonesPricingStepHandler->isFilled($vendor);
        $hasBookingBlockers   = $preloadedBookingBlockers !== null
            ? count($preloadedBookingBlockers) > 0
            : $this->vendorRepository->countBookingBlockersByVendor($vendor) > 0;

        return [
            'bio'            => $vendor->getBio() !== null && trim($vendor->getBio()) !== '',
            'styles'         => !$vendor->getStyles()->isEmpty(),
            'portfolio'      => $this->portfolioStepHandler->isFilled($vendor),
            'disponibilites' => $hasBookingBlockers,
            'zone'           => $zonesAndTarifsFilled,
            'tarifs'         => $zonesAndTarifsFilled,
        ];
    }

    /** @return array{bio: bool, portfolio: bool, disponibilites: bool, zone: bool, tarifs: bool} */
    public function checkForPublish(Vendor $vendor): array
    {
        $completion = $this->check($vendor);
        unset($completion['styles']);

        return $completion;
    }
}
