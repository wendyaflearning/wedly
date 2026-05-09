<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Enum\Vendor\VendorType;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'service')]
#[ORM\HasLifecycleCallbacks]
class Service
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\Column(name: 'name', length: 100)]
    private string $name;

    #[ORM\Column(name: 'slug', length: 100, unique: true)]
    private string $slug;

    #[ORM\Column(name: 'sort_order', type: 'integer')]
    private int $sortOrder;

    #[ORM\Column(name: 'category', type: 'string', enumType: VendorType::class, length: 20)]
    private VendorType $category;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true)]
    private ?Service $parent = null;

    #[ORM\OneToMany(targetEntity: Service::class, mappedBy: 'parent')]
    private Collection $children;

    public function __construct()
    {
        $this->children = new ArrayCollection();
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;

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

    public function getCategory(): VendorType
    {
        return $this->category;
    }

    public function setCategory(VendorType $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getParent(): ?Service
    {
        return $this->parent;
    }

    public function setParent(?Service $parent): static
    {
        $this->parent = $parent;

        return $this;
    }

    public function getChildren(): Collection
    {
        return $this->children;
    }

    public function addChild(Service $child): static
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }

    public function removeChild(Service $child): static
    {
        if ($this->children->removeElement($child) && $child->getParent() === $this) {
            $child->setParent(null);
        }

        return $this;
    }
}
