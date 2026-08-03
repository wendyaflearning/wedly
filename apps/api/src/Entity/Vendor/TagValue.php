<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Repository\Vendor\TagValueRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: TagValueRepository::class)]
#[ORM\Table(name: 'tag_value')]
#[ORM\HasLifecycleCallbacks]
class TagValue
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: TagType::class, inversedBy: 'tagValues')]
    #[ORM\JoinColumn(name: 'tag_type_id', referencedColumnName: 'id', nullable: false)]
    private TagType $tagType;

    #[ORM\Column(name: 'label', length: 100)]
    private string $label;

    #[ORM\Column(name: 'is_active', type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getTagType(): TagType
    {
        return $this->tagType;
    }

    public function setTagType(TagType $tagType): static
    {
        $this->tagType = $tagType;

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

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }
}
