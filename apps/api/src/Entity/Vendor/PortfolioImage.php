<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: PortfolioImageRepository::class)]
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

    #[ORM\ManyToOne(targetEntity: Vendor::class, inversedBy: 'portfolioImages')]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    #[ORM\Column(name: 'url', length: 255)]
    private string $url;

    #[ORM\Column(name: 'sort_order', type: 'integer')]
    private int $sortOrder;

    #[ORM\Column(name: 'cloudinary_public_id', length: 255, nullable: true)]
    private ?string $cloudinaryPublicId = null;

    #[ORM\Column(name: 'is_cover', type: 'boolean', options: ['default' => false])]
    private bool $isCover = false;

    #[ORM\Column(name: 'is_visible_in_wedream', type: 'boolean', options: ['default' => false])]
    private bool $isVisibleInWedream = false;

    #[ORM\ManyToMany(targetEntity: TagValue::class)]
    #[ORM\JoinTable(
        name: 'portfolio_image_tag',
        joinColumns: [new ORM\JoinColumn(name: 'portfolio_image_id', referencedColumnName: 'id', onDelete: 'CASCADE')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'tag_value_id', referencedColumnName: 'id')],
    )]
    private Collection $tags;

    public function __construct()
    {
        $this->tags = new ArrayCollection();
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

    public function getSortOrder(): int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): static
    {
        $this->sortOrder = $sortOrder;

        return $this;
    }

    public function getCloudinaryPublicId(): ?string
    {
        return $this->cloudinaryPublicId;
    }

    public function setCloudinaryPublicId(?string $cloudinaryPublicId): static
    {
        $this->cloudinaryPublicId = $cloudinaryPublicId;

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

    public function isVisibleInWedream(): bool
    {
        return $this->isVisibleInWedream;
    }

    public function setVisibleInWedream(bool $visible): static
    {
        $this->isVisibleInWedream = $visible;

        return $this;
    }

    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(TagValue $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(TagValue $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }
}
