<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Entity\Creator\CreatorValue;
use App\Enum\Vendor\CreatorSpecialty;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'vendor_creator_details')]
#[ORM\HasLifecycleCallbacks]
class VendorCreatorDetails
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\OneToOne(targetEntity: Vendor::class, inversedBy: 'creatorDetails')]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    #[ORM\Column(name: 'creator_specialty', type: 'string', enumType: CreatorSpecialty::class)]
    private CreatorSpecialty $creatorSpecialty;

    #[ORM\Column(name: 'has_fixed_workshop', type: 'boolean')]
    private bool $hasFixedWorkshop = false;

    #[ORM\Column(name: 'min_lead_time_months', type: 'smallint', nullable: true)]
    private ?int $minLeadTimeMonths = null;

    #[ORM\Column(name: 'annual_capacity', type: 'smallint', nullable: true)]
    private ?int $annualCapacity = null;

    #[ORM\Column(name: 'rdv_count', type: 'smallint', nullable: true)]
    private ?int $rdvCount = null;

    #[ORM\Column(name: 'first_rdv_duration_minutes', type: 'smallint', nullable: true)]
    private ?int $firstRdvDurationMinutes = null;

    #[ORM\ManyToMany(targetEntity: CreatorValue::class)]
    #[ORM\JoinTable(
        name: 'vendor_creator_value',
        joinColumns: [new ORM\JoinColumn(name: 'creator_details_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'creator_value_id', referencedColumnName: 'id')],
    )]
    private Collection $creatorValues;

    public function __construct()
    {
        $this->creatorValues = new ArrayCollection();
    }

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

    public function getCreatorSpecialty(): CreatorSpecialty
    {
        return $this->creatorSpecialty;
    }

    public function setCreatorSpecialty(CreatorSpecialty $creatorSpecialty): static
    {
        $this->creatorSpecialty = $creatorSpecialty;

        return $this;
    }

    public function isHasFixedWorkshop(): bool
    {
        return $this->hasFixedWorkshop;
    }

    public function setHasFixedWorkshop(bool $hasFixedWorkshop): static
    {
        $this->hasFixedWorkshop = $hasFixedWorkshop;

        return $this;
    }

    public function getMinLeadTimeMonths(): ?int
    {
        return $this->minLeadTimeMonths;
    }

    public function setMinLeadTimeMonths(?int $minLeadTimeMonths): static
    {
        $this->minLeadTimeMonths = $minLeadTimeMonths;

        return $this;
    }

    public function getAnnualCapacity(): ?int
    {
        return $this->annualCapacity;
    }

    public function setAnnualCapacity(?int $annualCapacity): static
    {
        $this->annualCapacity = $annualCapacity;

        return $this;
    }

    public function getRdvCount(): ?int
    {
        return $this->rdvCount;
    }

    public function setRdvCount(?int $rdvCount): static
    {
        $this->rdvCount = $rdvCount;

        return $this;
    }

    public function getFirstRdvDurationMinutes(): ?int
    {
        return $this->firstRdvDurationMinutes;
    }

    public function setFirstRdvDurationMinutes(?int $firstRdvDurationMinutes): static
    {
        $this->firstRdvDurationMinutes = $firstRdvDurationMinutes;

        return $this;
    }

    public function getCreatorValues(): Collection
    {
        return $this->creatorValues;
    }

    public function addCreatorValue(CreatorValue $value): static
    {
        if (!$this->creatorValues->contains($value)) {
            $this->creatorValues->add($value);
        }

        return $this;
    }

    public function removeCreatorValue(CreatorValue $value): static
    {
        $this->creatorValues->removeElement($value);

        return $this;
    }
}
