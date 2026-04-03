<?php

declare(strict_types=1);

namespace App\Entity;

use App\Entity\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use App\Doctrine\UuidV7Generator;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'plan')]
#[ORM\HasLifecycleCallbacks]
class Plan
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\Column(name: 'name', length: 50)]
    private string $name;

    /** Tarif en centimes (ex: 900 = 9,00 €) */
    #[ORM\Column(name: 'price_cents', type: 'integer')]
    private int $priceCents;

    /**
     * Nombre de services autorisés.
     * Convention : -1 = illimité (plan premium).
     */
    #[ORM\Column(name: 'service_count', type: 'integer')]
    private int $serviceCount;

    #[ORM\Column(name: 'is_active', type: 'boolean')]
    private bool $isActive = true;

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

    public function getPriceCents(): int
    {
        return $this->priceCents;
    }

    public function setPriceCents(int $priceCents): static
    {
        $this->priceCents = $priceCents;

        return $this;
    }

    public function getServiceCount(): int
    {
        return $this->serviceCount;
    }

    public function setServiceCount(int $serviceCount): static
    {
        $this->serviceCount = $serviceCount;

        return $this;
    }

    public function isUnlimited(): bool
    {
        return $this->serviceCount === -1;
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
