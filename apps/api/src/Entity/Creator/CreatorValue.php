<?php

declare(strict_types=1);

namespace App\Entity\Creator;

use App\Doctrine\UuidV7Generator;
use App\Repository\Creator\CreatorValueRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: CreatorValueRepository::class)]
#[ORM\Table(name: 'creator_value')]
#[ORM\HasLifecycleCallbacks]
class CreatorValue
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
}
