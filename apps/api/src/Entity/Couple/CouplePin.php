<?php

declare(strict_types=1);

namespace App\Entity\Couple;

use App\Doctrine\UuidV7Generator;
use App\Entity\Vendor\PortfolioImage;
use App\Repository\Couple\CouplePinRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: CouplePinRepository::class)]
#[ORM\Table(name: 'couple_pin')]
#[ORM\UniqueConstraint(name: 'UNIQ_couple_pin_couple_image', columns: ['couple_id', 'portfolio_image_id'])]
#[ORM\HasLifecycleCallbacks]
class CouplePin
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Couple::class)]
    #[ORM\JoinColumn(name: 'couple_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Couple $couple;

    #[ORM\ManyToOne(targetEntity: PortfolioImage::class)]
    #[ORM\JoinColumn(name: 'portfolio_image_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private PortfolioImage $portfolioImage;

    /**
     * Dé-épingler désactive la ligne au lieu de la supprimer (WED-183) : la
     * contrainte unique couple_id + portfolio_image_id reste tenue par une seule
     * ligne pour toute la vie du couple, et réépingler la réactive au lieu de
     * rejouer un INSERT contre cette contrainte.
     */
    #[ORM\Column(name: 'is_active', type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    public function __construct(Couple $couple, PortfolioImage $portfolioImage)
    {
        $this->couple = $couple;
        $this->portfolioImage = $portfolioImage;
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getCouple(): Couple
    {
        return $this->couple;
    }

    public function getPortfolioImage(): PortfolioImage
    {
        return $this->portfolioImage;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * Deux verbes métier plutôt qu'un setIsActive(bool) : côté appelant,
     * `deactivate()` dit ce qui se passe, `setIsActive(false)` demande au lecteur
     * de le déduire. Déviation assumée du patron TagValue / Plan, documentée
     * dans ADR-006.
     */
    public function reactivate(): void
    {
        $this->isActive = true;
    }

    public function deactivate(): void
    {
        $this->isActive = false;
    }
}
