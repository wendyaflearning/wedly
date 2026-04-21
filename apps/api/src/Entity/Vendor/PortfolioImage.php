<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Entity\Trait\TimestampableTrait;
use App\Entity\Wedding\WeddingStyle;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'portfolio_image')]
#[ORM\HasLifecycleCallbacks]
class PortfolioImage
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Vendor::class)]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    #[ORM\Column(name: 'url', length: 255)]
    private string $url;

    #[ORM\Column(name: 'sort_seq', type: 'integer')]
    private int $sortSeq;

    #[ORM\Column(name: 'is_cover', type: 'boolean')]
    private bool $isCover = false;

    #[ORM\ManyToMany(targetEntity: WeddingStyle::class)]
    #[ORM\JoinTable(
        name: 'portfolio_image_style',
        joinColumns: [new ORM\JoinColumn(name: 'portfolio_image_id', referencedColumnName: 'id')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'style_id', referencedColumnName: 'id')],
    )]
    private Collection $styles;

    public function __construct()
    {
        $this->styles = new ArrayCollection();
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

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): static
    {
        $this->url = $url;

        return $this;
    }

    public function getSortSeq(): int
    {
        return $this->sortSeq;
    }

    public function setSortSeq(int $sortSeq): static
    {
        $this->sortSeq = $sortSeq;

        return $this;
    }

    public function isCover(): bool
    {
        return $this->isCover;
    }

    public function setIsCover(bool $isCover): static
    {
        $this->isCover = $isCover;

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
}
