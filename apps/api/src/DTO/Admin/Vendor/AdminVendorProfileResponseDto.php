<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;

final readonly class AdminVendorProfileResponseDto
{
    public string $id;
    public string $status;
    public string $statusLabel;
    public string $vendorType;
    public string $vendorTypeLabel;
    public string $submittedAt;
    public ?string $reviewedAt;
    public array $summary;
    public array $profession;
    public array $experiences;
    public array $zonesPricing;
    public array $portfolio;
    public array $legal;
    public ?array $specificDetails;
    public ?array $rejection;

    public function __construct(Vendor $vendor)
    {
        $vendorType  = $vendor->resolveVendorType();
        $submittedAt = $vendor->getSubmittedForReviewAt() ?? $vendor->getUpdatedAt();

        $this->id              = $vendor->getId()->toRfc4122();
        $this->status          = $vendor->getStatus()->value;
        $this->statusLabel     = AdminVendorListItemResponseDto::statusLabel($vendor->getStatus());
        $this->vendorType      = $vendorType->value;
        $this->vendorTypeLabel = AdminVendorListItemResponseDto::vendorTypeLabel($vendorType);
        $this->submittedAt     = $submittedAt->format(\DateTimeInterface::ATOM);
        $this->reviewedAt      = $vendor->getReviewedAt()?->format(\DateTimeInterface::ATOM);

        $this->summary = [
            'brandName' => $vendor->getBrandName(),
            'firstName' => $vendor->getUser()->getFirstName(),
            'lastName'  => $vendor->getUser()->getLastName(),
            'email'     => $vendor->getUser()->getEmail(),
            'city'      => $vendor->getCity(),
        ];

        $this->profession = [
            'type'        => $this->vendorTypeLabel,
            'services'    => $this->services($vendor),
            'description' => $vendor->getDescription() ?? $vendor->getBio(),
        ];

        $this->experiences = [
            'cultures'    => $this->cultures($vendor),
            'confessions' => $this->confessions($vendor),
        ];

        $this->zonesPricing = [
            'regions'       => $this->regions($vendor),
            'priceMinCents' => $vendor->getPriceMinCents(),
            'priceMaxCents' => $vendor->getPriceMaxCents(),
            'priceType'     => $vendor->getPriceType()->value,
            'priceTypeLabel'=> self::priceTypeLabel($vendor->getPriceType()),
        ];

        $this->portfolio       = $this->portfolio($vendor);
        $this->legal           = $this->legal($vendor);
        $this->specificDetails = $this->specificDetails($vendor, $vendorType);
        $this->rejection       = $this->rejection($vendor);
    }

    private function services(Vendor $vendor): array
    {
        return array_map(
            fn(Service $service) => [
                'id'       => $service->getId()->toRfc4122(),
                'name'     => $service->getName(),
                'slug'     => $service->getSlug(),
                'category' => $service->getCategory()->value,
            ],
            $vendor->getServices()->toArray()
        );
    }

    private function cultures(Vendor $vendor): array
    {
        return array_map(
            fn(Culture $culture) => [
                'id'   => $culture->getId()->toRfc4122(),
                'name' => $culture->getName(),
                'slug' => $culture->getSlug(),
            ],
            $vendor->getCultures()->toArray()
        );
    }

    private function confessions(Vendor $vendor): array
    {
        return array_map(
            fn(Confession $confession) => [
                'id'   => $confession->getId()->toRfc4122(),
                'name' => $confession->getName(),
                'slug' => $confession->getSlug(),
            ],
            $vendor->getConfessions()->toArray()
        );
    }

    private function regions(Vendor $vendor): array
    {
        return array_map(
            fn(Region $region) => [
                'id'   => $region->getId()->toRfc4122(),
                'name' => $region->getName(),
                'slug' => $region->getSlug(),
            ],
            $vendor->getRegions()->toArray()
        );
    }

    private function portfolio(Vendor $vendor): array
    {
        $images = $vendor->getPortfolioImages()->toArray();
        usort($images, fn(PortfolioImage $a, PortfolioImage $b) => $a->getSortOrder() <=> $b->getSortOrder());

        return array_map(
            fn(PortfolioImage $image) => [
                'id'          => $image->getId()->toRfc4122(),
                'url'         => $image->getUrl(),
                'isCover'     => $image->isCover(),
                'styles'      => $this->tags($image->getStyles()->toArray()),
                'specialties' => $this->tags($image->getSpecialties()->toArray()),
            ],
            $images
        );
    }

    private function tags(array $tags): array
    {
        return array_map(
            fn(WeddingStyle|Specialty $tag) => [
                'id'   => $tag->getId()->toRfc4122(),
                'name' => $tag->getName(),
                'slug' => $tag->getSlug(),
            ],
            $tags
        );
    }

    private function legal(Vendor $vendor): array
    {
        return [
            'brandName'      => $vendor->getBrandName(),
            'firstName'      => $vendor->getUser()->getFirstName(),
            'lastName'       => $vendor->getUser()->getLastName(),
            'email'          => $vendor->getUser()->getEmail(),
            'phone'          => $vendor->getPhone(),
            'address'        => $vendor->getAddress(),
            'zipcode'        => $vendor->getZipcode(),
            'city'           => $vendor->getCity(),
            'siret'          => $vendor->getSiret(),
            'siretVerified'  => $vendor->isSiretVerified(),
            'legalName'      => $vendor->getLegalName(),
            'legalForm'      => $vendor->getLegalForm(),
            'legalStatus'    => $vendor->getLegalStatus(),
            'incorporatedAt' => $vendor->getIncorporatedAt()?->format('Y-m-d'),
        ];
    }

    private function specificDetails(Vendor $vendor, VendorType $vendorType): ?array
    {
        if ($vendorType === VendorType::Lieu) {
            $details = $vendor->getVenueDetails();

            return [
                'type'    => 'venue',
                'details' => [
                    'venueType'             => $details?->getVenueType()?->value,
                    'capacityMin'           => $details?->getCapacityMin(),
                    'capacityMax'           => $details?->getCapacityMax(),
                    'nearestCity'           => $details?->getNearestCity(),
                    'distanceToCityMinutes' => $details?->getDistanceToCityMinutes(),
                    'hasCatering'           => $details?->isHasCatering(),
                    'hasAccommodation'      => $details?->isHasAccommodation(),
                    'hasOutdoorSpace'       => $details?->isHasOutdoorSpace(),
                    'hasCorkageFee'         => $details?->isHasCorkageFee(),
                    'hasToilets'            => $details?->isHasToilets(),
                    'isPmrAccessible'       => $details?->isIsPmrAccessible(),
                ],
            ];
        }

        if ($vendorType === VendorType::Traiteur) {
            $details = $vendor->getCateringDetails();

            return [
                'type'    => 'catering',
                'details' => [
                    'coversMin'              => $details?->getCoversMin(),
                    'coversMax'              => $details?->getCoversMax(),
                    'isKosher'               => $details?->isKosher(),
                    'isHalal'                => $details?->isHalal(),
                    'isVegan'                => $details?->isVegan(),
                    'isGlutenFree'           => $details?->isGlutenFree(),
                    'offersTableService'     => $details?->isOffersTableService(),
                    'offersBuffet'           => $details?->isOffersBuffet(),
                    'offersCocktail'         => $details?->isOffersCocktail(),
                    'providesTableware'      => $details?->isProvidesTableware(),
                    'providesFurniture'      => $details?->isProvidesFurniture(),
                ],
            ];
        }

        return null;
    }

    private function rejection(Vendor $vendor): ?array
    {
        if ($vendor->getStatus() !== VendorStatus::Rejected) {
            return null;
        }

        $reasons = $vendor->getRejectionReasons() ?? [];

        return [
            'reasons' => array_map(
                fn(string $reason) => [
                    'key'   => $reason,
                    'label' => VendorRejectionReason::tryFrom($reason)?->label() ?? $reason,
                ],
                $reasons
            ),
            'note' => $vendor->getRejectionNote(),
        ];
    }

    private static function priceTypeLabel(PriceType $priceType): string
    {
        return match ($priceType) {
            PriceType::PerService => 'Par prestation',
            PriceType::PerPerson  => 'Par personne',
            PriceType::PerHour    => "À l'heure",
        };
    }
}
