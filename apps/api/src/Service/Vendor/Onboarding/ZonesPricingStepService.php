<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\Vendor\Step\CateringPricingDto;
use App\DTO\Vendor\Step\FreelancePricingDto;
use App\DTO\Vendor\Step\VenuePricingDto;
use App\Entity\Region\Region;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
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
        $vendorType = VendorType::resolveVendorType($vendor->resolveVendorServices());

        /** @var VenuePricingDto|CateringPricingDto|FreelancePricingDto $dto */
        $dto = $this->validate(match ($vendorType) {
            VendorType::Lieu      => VenuePricingDto::fromArray($data),
            VendorType::Traiteur  => CateringPricingDto::fromArray($data),
            VendorType::Freelance => FreelancePricingDto::fromArray($data),
        });

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
