<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;

final readonly class AdminVendorDraftResponseDto
{
    public string $id;
    public string $status;
    public ?array $invitation;
    public array $identity;
    public array $profession;
    public array $experiences;
    public array $zonesPricing;
    public array $legalInfo;
    public ?array $venueCharacteristics;
    public ?array $cateringCharacteristics;

    public function __construct(Vendor $vendor, ?InviteToken $inviteToken = null)
    {
        $service = $vendor->getServices()->first();
        $venueDetails = $vendor->getVenueDetails();
        $cateringDetails = $vendor->getCateringDetails();

        $this->id = $vendor->getId()->toRfc4122();
        $this->status = $vendor->getStatus()->value;
        $this->invitation = $inviteToken === null ? null : [
            'id'        => $inviteToken->getId()->toRfc4122(),
            'token'     => $inviteToken->getToken(),
            'status'    => $inviteToken->getStatus()->value,
            'expiresAt' => $inviteToken->getExpiresAt()->format(\DateTimeInterface::ATOM),
        ];
        $this->identity = [
            'firstname' => $vendor->getUser()->getFirstName(),
            'lastName'  => $vendor->getUser()->getLastName(),
            'email'     => $vendor->getUser()->getEmail(),
            'brandName' => $vendor->getBrandName(),
        ];
        $this->profession = [
            'serviceId' => $service instanceof Service ? $service->getId()->toRfc4122() : null,
        ];
        $this->experiences = [
            'cultureIds' => $vendor->getCultures()
                ->map(fn(Culture $culture) => $culture->getId()->toRfc4122())
                ->toArray(),
            'confessionIds' => $vendor->getConfessions()
                ->map(fn(Confession $confession) => $confession->getId()->toRfc4122())
                ->toArray(),
        ];
        $this->zonesPricing = [
            'regions' => $vendor->getRegions()
                ->map(fn(Region $region) => $region->getId()->toRfc4122())
                ->toArray(),
            'priceMin'  => $vendor->getPriceMinCents(),
            'priceMax'  => $vendor->getPriceMaxCents(),
            'priceType' => $vendor->getPriceType()->value,
            'city'      => $vendor->getCity(),
        ];
        $this->legalInfo = [
            'phone'   => $vendor->getPhone(),
            'address' => $vendor->getAddress(),
            'zipcode' => $vendor->getZipcode(),
            'city'    => $vendor->getCity(),
            'siret'   => $vendor->getSiret(),
        ];
        $this->venueCharacteristics = $venueDetails === null ? null : [
            'venueType'              => $venueDetails->getVenueType()->value,
            'capacityMin'            => $venueDetails->getCapacityMin(),
            'capacityMax'            => $venueDetails->getCapacityMax(),
            'hasCatering'            => $venueDetails->isHasCatering(),
            'hasAccommodation'       => $venueDetails->isHasAccommodation(),
            'hasOutdoorSpace'        => $venueDetails->isHasOutdoorSpace(),
            'hasCorkageFee'          => $venueDetails->isHasCorkageFee(),
            'hasToilets'             => $venueDetails->isHasToilets(),
            'isPmrAccessible'        => $venueDetails->isIsPmrAccessible(),
            'nearestCity'            => $venueDetails->getNearestCity(),
            'distanceToCityMinutes'  => $venueDetails->getDistanceToCityMinutes(),
        ];
        $this->cateringCharacteristics = $cateringDetails === null ? null : [
            'coversMin'               => $cateringDetails->getCoversMin(),
            'coversMax'               => $cateringDetails->getCoversMax(),
            'isKosher'                => $cateringDetails->isKosher(),
            'isHalal'                 => $cateringDetails->isHalal(),
            'isVegan'                 => $cateringDetails->isVegan(),
            'isGlutenFree'            => $cateringDetails->isGlutenFree(),
            'offersTableService'      => $cateringDetails->isOffersTableService(),
            'offersBuffet'            => $cateringDetails->isOffersBuffet(),
            'offersCocktail'          => $cateringDetails->isOffersCocktail(),
            'providesTableware'       => $cateringDetails->isProvidesTableware(),
            'providesFurniture'       => $cateringDetails->isProvidesFurniture(),
        ];
    }
}
