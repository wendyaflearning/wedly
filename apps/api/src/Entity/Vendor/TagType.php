<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Repository\Vendor\TagTypeRepository;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: TagTypeRepository::class)]
#[ORM\Table(name: 'tag_type')]
#[ORM\HasLifecycleCallbacks]
class TagType
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: 'tagTypes')]
    #[ORM\JoinColumn(name: 'service_id', referencedColumnName: 'id', nullable: false)]
    private Service $service;

    #[ORM\Column(name: 'label', length: 100)]
    private string $label;

    #[ORM\Column(name: 'is_primary', type: 'boolean', options: ['default' => false])]
    private bool $isPrimary = false;

    #[ORM\Column(name: 'max_selections', type: 'integer', nullable: true)]
    private ?int $maxSelections = null;

    #[ORM\Column(name: 'is_active', type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\OneToMany(targetEntity: TagValue::class, mappedBy: 'tagType')]
    private Collection $tagValues;

    public function __construct()
    {
        $this->tagValues = new ArrayCollection();
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getService(): Service
    {
        return $this->service;
    }

    public function setService(Service $service): static
    {
        $this->service = $service;

        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function isPrimary(): bool
    {
        return $this->isPrimary;
    }

    public function setIsPrimary(bool $isPrimary): static
    {
        $this->isPrimary = $isPrimary;

        return $this;
    }

    public function getMaxSelections(): ?int
    {
        return $this->maxSelections;
    }

    public function setMaxSelections(?int $maxSelections): static
    {
        $this->maxSelections = $maxSelections;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getTagValues(): Collection
    {
        return $this->tagValues;
    }
}
