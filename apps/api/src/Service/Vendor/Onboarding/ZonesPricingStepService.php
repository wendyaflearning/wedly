<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\CateringPricingDto;
use App\DTO\Vendor\Step\FreelancePricingDto;
use App\DTO\Vendor\Step\VenuePricingDto;
use App\Entity\Region\Region;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorType;
use App\Repository\Region\RegionRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class ZonesPricingStepService extends AbstractOnboardingStepHandler
{
    public function __construct(
        private RegionRepository $regionRepository,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::ZonesPricing;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        $vendorType = $vendor->resolveVendorType();

        /** @var VenuePricingDto|CateringPricingDto|FreelancePricingDto $dto */
        $dto = $this->validate(match ($vendorType) {
            VendorType::Lieu       => VenuePricingDto::fromArray($data),
            VendorType::Traiteur   => CateringPricingDto::fromArray($data),
            VendorType::Freelance,
            VendorType::Createurs  => FreelancePricingDto::fromArray($data),
        });

        $vendor->setPriceMinCents($dto->priceMin);
        $vendor->setPriceMaxCents($dto->priceMax);
        $vendor->setPriceType(PriceType::from($dto->priceType));

        $regions = $this->fetchRegions($dto->zones);
        $vendor->syncZones($regions);

        if ($dto instanceof VenuePricingDto) {
            $vendor->setCity($dto->city);

            $venueDetails = $vendor->getVenueDetails();
            if ($venueDetails === null) {
                throw new \DomainException("L'étape venue_characteristics doit être complétée avant zones_pricing.", 422);
            }
            $venueDetails->setNearestCity($dto->nearestCity);
            $venueDetails->setDistanceToCityMinutes($dto->distanceToCityMinutes);
        }
    }

    public function getStepData(Vendor $vendor): array
    {
        if ($vendor->getRegions()->isEmpty()) {
            return [];
        }

        $vendorType = $vendor->resolveVendorType();

        $data = [
            'price_min'  => $vendor->getPriceMinCents(),
            'price_max'  => $vendor->getPriceMaxCents(),
            'price_type' => $vendor->getPriceType()->value,
            'zones'      => $vendor->getRegions()
                ->map(fn(Region $r) => $r->getId()->toRfc4122())
                ->toArray(),
        ];

        if ($vendorType === VendorType::Lieu) {
            $venueDetails                     = $vendor->getVenueDetails();
            $data['city']                     = $vendor->getCity();
            $data['nearest_city']             = $venueDetails?->getNearestCity();
            $data['distance_to_city_minutes'] = $venueDetails?->getDistanceToCityMinutes();
        }

        return $data;
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
