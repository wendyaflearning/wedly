<?php

declare(strict_types=1);

namespace App\Entity\Wedding;

use App\Doctrine\UuidV7Generator;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Enum\Vendor\Zone;
use App\Enum\Wedding\Ambiance;
use App\Enum\Wedding\CeremonyType;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'wedding')]
#[ORM\HasLifecycleCallbacks]
class Wedding
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\Column(name: 'date', type: 'date_immutable')]
    private \DateTimeImmutable $date;

    #[ORM\Column(name: 'budget_cents', type: 'integer')]
    private int $budgetCents;

    #[ORM\Column(name: 'location', length: 255)]
    private string $location;

    #[ORM\Column(name: 'zone', type: 'string', enumType: Zone::class, nullable: true)]
    private ?Zone $zone = null;

    #[ORM\Column(name: 'guest_count', type: 'integer')]
    private int $guestCount;

    #[ORM\Column(name: 'ambiance', type: 'string', enumType: Ambiance::class, nullable: true)]
    private ?Ambiance $ambiance = null;

    #[ORM\Column(name: 'ceremony_type', type: 'string', enumType: CeremonyType::class, nullable: true)]
    private ?CeremonyType $ceremonyType = null;

    #[ORM\ManyToMany(targetEntity: WeddingStyle::class)]
    #[ORM\JoinTable(
        name: 'wedding_style',
        joinColumns: [new ORM\JoinColumn(name: 'wedding_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'style_id', referencedColumnName: 'id')],
    )]
    private Collection $styles;

    #[ORM\ManyToMany(targetEntity: Culture::class)]
    #[ORM\JoinTable(
        name: 'wedding_culture',
        joinColumns: [new ORM\JoinColumn(name: 'wedding_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'culture_id', referencedColumnName: 'id')],
    )]
    private Collection $cultures;

    #[ORM\ManyToMany(targetEntity: Confession::class)]
    #[ORM\JoinTable(
        name: 'wedding_confession',
        joinColumns: [new ORM\JoinColumn(name: 'wedding_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'confession_id', referencedColumnName: 'id')],
    )]
    private Collection $confessions;

    public function __construct()
    {
        $this->styles     = new ArrayCollection();
        $this->cultures   = new ArrayCollection();
        $this->confessions = new ArrayCollection();
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getDate(): \DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeImmutable $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getBudgetCents(): int
    {
        return $this->budgetCents;
    }

    public function setBudgetCents(int $budgetCents): static
    {
        $this->budgetCents = $budgetCents;

        return $this;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function setLocation(string $location): static
    {
        $this->location = $location;

        return $this;
    }

    public function getZone(): ?Zone
    {
        return $this->zone;
    }

    public function setZone(?Zone $zone): static
    {
        $this->zone = $zone;

        return $this;
    }

    public function getGuestCount(): int
    {
        return $this->guestCount;
    }

    public function setGuestCount(int $guestCount): static
    {
        $this->guestCount = $guestCount;

        return $this;
    }

    public function getAmbiance(): ?Ambiance
    {
        return $this->ambiance;
    }

    public function setAmbiance(?Ambiance $ambiance): static
    {
        $this->ambiance = $ambiance;

        return $this;
    }

    public function getCeremonyType(): ?CeremonyType
    {
        return $this->ceremonyType;
    }

    public function setCeremonyType(?CeremonyType $ceremonyType): static
    {
        $this->ceremonyType = $ceremonyType;

        return $this;
    }

    public function getStyles(): Collection
    {
        return $this->styles;
    }

    public function addStyle(WeddingStyle $style): static
    {
        if (!$this->styles->contains($style)) {
            $this->styles->add($style);
        }

        return $this;
    }

    public function removeStyle(WeddingStyle $style): static
    {
        $this->styles->removeElement($style);

        return $this;
    }

    public function getCultures(): Collection
    {
        return $this->cultures;
    }

    public function addCulture(Culture $culture): static
    {
        if (!$this->cultures->contains($culture)) {
            $this->cultures->add($culture);
        }

        return $this;
    }

    public function removeCulture(Culture $culture): static
    {
        $this->cultures->removeElement($culture);

        return $this;
    }

    public function getConfessions(): Collection
    {
        return $this->confessions;
    }

    public function addConfession(Confession $confession): static
    {
        if (!$this->confessions->contains($confession)) {
            $this->confessions->add($confession);
        }

        return $this;
    }

    public function removeConfession(Confession $confession): static
    {
        $this->confessions->removeElement($confession);

        return $this;
    }
}
