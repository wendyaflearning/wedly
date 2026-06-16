<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\User;
use App\Entity\Wedding\WeddingStyle;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Repository\Vendor\VendorRepository;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: VendorRepository::class)]
#[ORM\Table(name: 'vendor')]
#[ORM\HasLifecycleCallbacks]
class Vendor
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\Column(name: 'brand_name', length: 255)]
    private string $brandName;

    #[ORM\Column(name: 'description', type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'siret', length: 14, nullable: true)]
    private ?string $siret = null;

    #[ORM\Column(name: 'address', length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(name: 'zipcode', length: 10, nullable: true)]
    private ?string $zipcode = null;

    #[ORM\Column(name: 'city', length: 100, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(name: 'phone', length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(name: 'legal_name', length: 255, nullable: true)]
    private ?string $legalName = null;

    #[ORM\Column(name: 'legal_form', length: 100, nullable: true)]
    private ?string $legalForm = null;

    #[ORM\Column(name: 'incorporated_at', type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $incorporatedAt = null;

    #[ORM\Column(name: 'legal_status', length: 50, nullable: true)]
    private ?string $legalStatus = null;

    #[ORM\Column(name: 'siret_verified', type: 'boolean', options: ['default' => false])]
    private bool $siretVerified = false;

    #[ORM\Column(name: 'price_type', type: 'string', enumType: PriceType::class)]
    private PriceType $priceType;

    #[ORM\Column(name: 'price_min_cents', type: 'integer')]
    private int $priceMinCents;

    #[ORM\Column(name: 'price_max_cents', type: 'integer')]
    private int $priceMaxCents;

    #[ORM\Column(name: 'status', type: 'string', enumType: VendorStatus::class)]
    private VendorStatus $status = VendorStatus::Pending;

    #[ORM\Column(name: 'onboarding_step', type: 'string', enumType: OnboardingStep::class, nullable: true)]
    private ?OnboardingStep $onboardingStep = null;

    #[ORM\Column(name: 'bio', type: 'text', nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(name: 'is_published', type: 'boolean', options: ['default' => false])]
    private bool $isPublished = false;

    #[ORM\ManyToMany(targetEntity: Service::class)]
    #[ORM\JoinTable(
        name: 'vendor_service',
        joinColumns: [new ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'service_id', referencedColumnName: 'id')],
    )]
    private Collection $services;

    #[ORM\ManyToMany(targetEntity: WeddingStyle::class)]
    #[ORM\JoinTable(
        name: 'vendor_style',
        joinColumns: [new ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'style_id', referencedColumnName: 'id')],
    )]
    private Collection $styles;

    #[ORM\ManyToMany(targetEntity: Culture::class)]
    #[ORM\JoinTable(
        name: 'vendor_culture',
        joinColumns: [new ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'culture_id', referencedColumnName: 'id')],
    )]
    private Collection $cultures;

    #[ORM\ManyToMany(targetEntity: Confession::class)]
    #[ORM\JoinTable(
        name: 'vendor_confession',
        joinColumns: [new ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'confession_id', referencedColumnName: 'id')],
    )]
    private Collection $confessions;

    #[ORM\ManyToMany(targetEntity: Region::class, inversedBy: 'vendors')]
    #[ORM\JoinTable(
        name: 'vendor_zones',
        joinColumns: [new ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'region_id', referencedColumnName: 'id')],
    )]
    private Collection $regions;

    #[ORM\OneToMany(targetEntity: PortfolioImage::class, mappedBy: 'vendor', cascade: ['persist', 'remove'])]
    private Collection $portfolioImages;

    #[ORM\OneToOne(targetEntity: VendorVenueDetails::class, mappedBy: 'vendor', cascade: ['persist', 'remove'])]
    private ?VendorVenueDetails $venueDetails = null;

    #[ORM\OneToOne(targetEntity: VendorCateringDetails::class, mappedBy: 'vendor', cascade: ['persist', 'remove'])]
    private ?VendorCateringDetails $cateringDetails = null;

    #[ORM\OneToOne(targetEntity: VendorAnimationDetails::class, mappedBy: 'vendor', cascade: ['persist', 'remove'])]
    private ?VendorAnimationDetails $animationDetails = null;

    #[ORM\OneToOne(targetEntity: VendorCreatorDetails::class, mappedBy: 'vendor', cascade: ['persist', 'remove'])]
    private ?VendorCreatorDetails $creatorDetails = null;

    public function __construct()
    {
        $this->services        = new ArrayCollection();
        $this->styles          = new ArrayCollection();
        $this->cultures        = new ArrayCollection();
        $this->confessions     = new ArrayCollection();
        $this->regions         = new ArrayCollection();
        $this->portfolioImages = new ArrayCollection();
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getBrandName(): string
    {
        return $this->brandName;
    }

    public function setBrandName(string $brandName): static
    {
        $this->brandName = $brandName;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getSiret(): ?string
    {
        return $this->siret;
    }

    public function setSiret(?string $siret): static
    {
        $this->siret = $siret;

        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;

        return $this;
    }

    public function getZipcode(): ?string
    {
        return $this->zipcode;
    }

    public function setZipcode(?string $zipcode): static
    {
        $this->zipcode = $zipcode;

        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): static
    {
        $this->city = $city;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getLegalName(): ?string
    {
        return $this->legalName;
    }

    public function setLegalName(?string $legalName): static
    {
        $this->legalName = $legalName;

        return $this;
    }

    public function getLegalForm(): ?string
    {
        return $this->legalForm;
    }

    public function setLegalForm(?string $legalForm): static
    {
        $this->legalForm = $legalForm;

        return $this;
    }

    public function getIncorporatedAt(): ?\DateTimeImmutable
    {
        return $this->incorporatedAt;
    }

    public function setIncorporatedAt(?\DateTimeImmutable $incorporatedAt): static
    {
        $this->incorporatedAt = $incorporatedAt;

        return $this;
    }

    public function getLegalStatus(): ?string
    {
        return $this->legalStatus;
    }

    public function setLegalStatus(?string $legalStatus): static
    {
        $this->legalStatus = $legalStatus;

        return $this;
    }

    public function isSiretVerified(): bool
    {
        return $this->siretVerified;
    }

    public function setSiretVerified(bool $siretVerified): static
    {
        $this->siretVerified = $siretVerified;

        return $this;
    }

    public function getPriceType(): PriceType
    {
        return $this->priceType;
    }

    public function setPriceType(PriceType $priceType): static
    {
        $this->priceType = $priceType;

        return $this;
    }

    public function getPriceMinCents(): int
    {
        return $this->priceMinCents;
    }

    public function setPriceMinCents(int $priceMinCents): static
    {
        $this->priceMinCents = $priceMinCents;

        return $this;
    }

    public function getPriceMaxCents(): int
    {
        return $this->priceMaxCents;
    }

    public function setPriceMaxCents(int $priceMaxCents): static
    {
        $this->priceMaxCents = $priceMaxCents;

        return $this;
    }

    public function getStatus(): VendorStatus
    {
        return $this->status;
    }

    public function setStatus(VendorStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getOnboardingStep(): ?OnboardingStep
    {
        return $this->onboardingStep;
    }

    public function setOnboardingStep(?OnboardingStep $onboardingStep): static
    {
        $this->onboardingStep = $onboardingStep;

        return $this;
    }

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): static
    {
        $this->bio = $bio;

        return $this;
    }

    public function isPublished(): bool
    {
        return $this->isPublished;
    }

    public function setIsPublished(bool $isPublished): static
    {
        $this->isPublished = $isPublished;

        return $this;
    }

    public function getServices(): Collection
    {
        return $this->services;
    }

    /** @return string[] */
    public function resolveVendorServices(): array
    {
        return array_map(fn(Service $service) => $service->getSlug(), $this->services->toArray());
    }

    public function resolveVendorType(): VendorType
    {
        foreach ($this->services as $service) {
            if ($service->getCategory() !== VendorType::Freelance) {
                return $service->getCategory();
            }
        }

        return VendorType::Freelance;
    }

    public function addService(Service $service): static
    {
        if (!$this->services->contains($service)) {
            $this->services->add($service);
        }

        return $this;
    }

    public function removeService(Service $service): static
    {
        $this->services->removeElement($service);

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

    public function getRegions(): Collection
    {
        return $this->regions;
    }

    /** @param Region[] $regions */
    public function syncZones(array $regions): void
    {
        $this->regions->clear();
        foreach ($regions as $region) {
            $this->regions->add($region);
        }
    }

    public function addRegion(Region $region): static
    {
        if (!$this->regions->contains($region)) {
            $this->regions->add($region);
        }

        return $this;
    }

    public function removeRegion(Region $region): static
    {
        $this->regions->removeElement($region);

        return $this;
    }

    public function getPortfolioImages(): Collection
    {
        return $this->portfolioImages;
    }

    public function getVenueDetails(): ?VendorVenueDetails
    {
        return $this->venueDetails;
    }

    public function setVenueDetails(?VendorVenueDetails $venueDetails): static
    {
        $this->venueDetails = $venueDetails;

        return $this;
    }

    public function getCateringDetails(): ?VendorCateringDetails
    {
        return $this->cateringDetails;
    }

    public function setCateringDetails(?VendorCateringDetails $cateringDetails): static
    {
        $this->cateringDetails = $cateringDetails;

        return $this;
    }

    public function getAnimationDetails(): ?VendorAnimationDetails
    {
        return $this->animationDetails;
    }

    public function setAnimationDetails(?VendorAnimationDetails $animationDetails): static
    {
        $this->animationDetails = $animationDetails;

        return $this;
    }

    public function getCreatorDetails(): ?VendorCreatorDetails
    {
        return $this->creatorDetails;
    }

    public function setCreatorDetails(?VendorCreatorDetails $creatorDetails): static
    {
        $this->creatorDetails = $creatorDetails;

        return $this;
    }
}
