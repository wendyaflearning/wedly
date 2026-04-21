<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Entity\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'vendor_catering_details')]
#[ORM\HasLifecycleCallbacks]
class VendorCateringDetails
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\OneToOne(targetEntity: Vendor::class, inversedBy: 'cateringDetails')]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    #[ORM\Column(name: 'is_kosher', type: 'boolean')]
    private bool $isKosher = false;

    #[ORM\Column(name: 'is_halal', type: 'boolean')]
    private bool $isHalal = false;

    #[ORM\Column(name: 'is_vegan', type: 'boolean')]
    private bool $isVegan = false;

    #[ORM\Column(name: 'is_gluten_free', type: 'boolean')]
    private bool $isGlutenFree = false;

    #[ORM\Column(name: 'offers_table_service', type: 'boolean')]
    private bool $offersTableService = false;

    #[ORM\Column(name: 'offers_buffet', type: 'boolean')]
    private bool $offersBuffet = false;

    #[ORM\Column(name: 'offers_cocktail', type: 'boolean')]
    private bool $offersCocktail = false;

    #[ORM\Column(name: 'provides_tableware', type: 'boolean')]
    private bool $providesTableware = false;

    #[ORM\Column(name: 'provides_furniture', type: 'boolean')]
    private bool $providesFurniture = false;

    #[ORM\Column(name: 'covers_min', type: 'integer', nullable: true)]
    private ?int $coversMin = null;

    #[ORM\Column(name: 'covers_max', type: 'integer', nullable: true)]
    private ?int $coversMax = null;

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

    public function isKosher(): bool
    {
        return $this->isKosher;
    }

    public function setIsKosher(bool $isKosher): static
    {
        $this->isKosher = $isKosher;

        return $this;
    }

    public function isHalal(): bool
    {
        return $this->isHalal;
    }

    public function setIsHalal(bool $isHalal): static
    {
        $this->isHalal = $isHalal;

        return $this;
    }

    public function isVegan(): bool
    {
        return $this->isVegan;
    }

    public function setIsVegan(bool $isVegan): static
    {
        $this->isVegan = $isVegan;

        return $this;
    }

    public function isGlutenFree(): bool
    {
        return $this->isGlutenFree;
    }

    public function setIsGlutenFree(bool $isGlutenFree): static
    {
        $this->isGlutenFree = $isGlutenFree;

        return $this;
    }

    public function isOffersTableService(): bool
    {
        return $this->offersTableService;
    }

    public function setOffersTableService(bool $offersTableService): static
    {
        $this->offersTableService = $offersTableService;

        return $this;
    }

    public function isOffersBuffet(): bool
    {
        return $this->offersBuffet;
    }

    public function setOffersBuffet(bool $offersBuffet): static
    {
        $this->offersBuffet = $offersBuffet;

        return $this;
    }

    public function isOffersCocktail(): bool
    {
        return $this->offersCocktail;
    }

    public function setOffersCocktail(bool $offersCocktail): static
    {
        $this->offersCocktail = $offersCocktail;

        return $this;
    }

    public function isProvidesTableware(): bool
    {
        return $this->providesTableware;
    }

    public function setProvidesTableware(bool $providesTableware): static
    {
        $this->providesTableware = $providesTableware;

        return $this;
    }

    public function isProvidesFurniture(): bool
    {
        return $this->providesFurniture;
    }

    public function setProvidesFurniture(bool $providesFurniture): static
    {
        $this->providesFurniture = $providesFurniture;

        return $this;
    }

    public function getCoversMin(): ?int
    {
        return $this->coversMin;
    }

    public function setCoversMin(?int $coversMin): static
    {
        $this->coversMin = $coversMin;

        return $this;
    }

    public function getCoversMax(): ?int
    {
        return $this->coversMax;
    }

    public function setCoversMax(?int $coversMax): static
    {
        $this->coversMax = $coversMax;

        return $this;
    }
}
