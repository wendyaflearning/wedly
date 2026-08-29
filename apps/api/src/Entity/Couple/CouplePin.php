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
}
