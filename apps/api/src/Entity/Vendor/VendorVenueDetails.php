<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\Vendor\VenueType;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'vendor_venue_details')]
#[ORM\HasLifecycleCallbacks]
class VendorVenueDetails
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\OneToOne(targetEntity: Vendor::class, inversedBy: 'venueDetails')]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    #[ORM\Column(name: 'has_catering', type: 'boolean')]
    private bool $hasCatering = false;

    #[ORM\Column(name: 'has_accommodation', type: 'boolean')]
    private bool $hasAccommodation = false;

    #[ORM\Column(name: 'has_outdoor_space', type: 'boolean')]
    private bool $hasOutdoorSpace = false;

    #[ORM\Column(name: 'has_corkage_fee', type: 'boolean')]
    private bool $hasCorkageFee = false;

    #[ORM\Column(name: 'is_pmr_accessible', type: 'boolean')]
    private bool $isPmrAccessible = false;

    #[ORM\Column(name: 'has_toilets', type: 'boolean')]
    private bool $hasToilets = false;

    #[ORM\Column(name: 'capacity_min', type: 'integer', nullable: true)]
    private ?int $capacityMin = null;

    #[ORM\Column(name: 'capacity_max', type: 'integer', nullable: true)]
    private ?int $capacityMax = null;

    #[ORM\Column(name: 'distance_to_city_minutes', type: 'integer', nullable: true)]
    private ?int $distanceToCityMinutes = null;

    #[ORM\Column(name: 'venue_type', type: 'string', enumType: VenueType::class)]
    private VenueType $venueType;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function setVendor(Vendor $vendor): static
    {
        $this->vendor = $vendor;

        return $this;
    }

    public function isHasCatering(): bool
    {
        return $this->hasCatering;
    }

    public function setHasCatering(bool $hasCatering): static
    {
        $this->hasCatering = $hasCatering;

        return $this;
    }

    public function isHasAccommodation(): bool
    {
        return $this->hasAccommodation;
    }

    public function setHasAccommodation(bool $hasAccommodation): static
    {
        $this->hasAccommodation = $hasAccommodation;

        return $this;
    }

    public function isHasOutdoorSpace(): bool
    {
        return $this->hasOutdoorSpace;
    }

    public function setHasOutdoorSpace(bool $hasOutdoorSpace): static
    {
        $this->hasOutdoorSpace = $hasOutdoorSpace;

        return $this;
    }

    public function isHasCorkageFee(): bool
    {
        return $this->hasCorkageFee;
    }

    public function setHasCorkageFee(bool $hasCorkageFee): static
    {
        $this->hasCorkageFee = $hasCorkageFee;

        return $this;
    }

    public function isIsPmrAccessible(): bool
    {
        return $this->isPmrAccessible;
    }

    public function setIsPmrAccessible(bool $isPmrAccessible): static
    {
        $this->isPmrAccessible = $isPmrAccessible;

        return $this;
    }

    public function isHasToilets(): bool
    {
        return $this->hasToilets;
    }

    public function setHasToilets(bool $hasToilets): static
    {
        $this->hasToilets = $hasToilets;

        return $this;
    }

    public function getCapacityMin(): ?int
    {
        return $this->capacityMin;
    }

    public function setCapacityMin(?int $capacityMin): static
    {
        $this->capacityMin = $capacityMin;

        return $this;
    }

    public function getCapacityMax(): ?int
    {
        return $this->capacityMax;
    }

    public function setCapacityMax(?int $capacityMax): static
    {
        $this->capacityMax = $capacityMax;

        return $this;
    }

    public function getDistanceToCityMinutes(): ?int
    {
        return $this->distanceToCityMinutes;
    }

    public function setDistanceToCityMinutes(?int $distanceToCityMinutes): static
    {
        $this->distanceToCityMinutes = $distanceToCityMinutes;

        return $this;
    }

    public function getVenueType(): VenueType
    {
        return $this->venueType;
    }

    public function setVenueType(VenueType $venueType): static
    {
        $this->venueType = $venueType;

        return $this;
    }
}
