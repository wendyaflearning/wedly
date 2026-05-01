<?php

declare(strict_types=1);

namespace App\Service\VendorOnboarding;

use App\DTO\DTOInterface;
use App\DTO\Vendor\Step\CateringPricingDto;
use App\DTO\Vendor\Step\FreelancePricingDto;
use App\DTO\Vendor\Step\VenuePricingDto;
use App\Entity\Region\Region;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\Vendor\PriceType;
use App\Repository\Region\RegionRepository;

readonly class ZonesPricingStepService
{
    public function __construct(
        private RegionRepository $regionRepository,
    ) {}

    public function handle(Vendor $vendor, DTOInterface $dto): void
    {
        /** @var VenuePricingDto|CateringPricingDto|FreelancePricingDto $dto */
        $vendor->setPriceMinCents($dto->priceMin);
        $vendor->setPriceMaxCents($dto->priceMax);
        $vendor->setPriceType(PriceType::from($dto->priceType));

        $regions = $this->fetchRegions($dto->zones);
        $vendor->syncZones($regions);

        if ($dto instanceof VenuePricingDto) {
            $vendor->setCity($dto->city);

            $venueDetails = $vendor->getVenueDetails() ?? new VendorVenueDetails();
            $venueDetails->setNearestCity($dto->nearestCity);
            $venueDetails->setDistanceToCityMinutes($dto->distanceToCityMinutes);
        }
    }

    /** @return Region[] */
    private function fetchRegions(array $regionIds): array
    {
        $regions = [];
        foreach ($regionIds as $regionId) {
            $region = $this->regionRepository->find($regionId);
            if ($region === null) {
                throw new \DomainException(sprintf('Région introuvable : %s', $regionId), 422);
            }
            $regions[] = $region;
        }

        return $regions;
    }
}
