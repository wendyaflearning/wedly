<?php

declare(strict_types=1);

namespace App\Entity\ProviderLead;

use App\Doctrine\UuidV7Generator;
use App\Entity\Couple\Couple;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadOrigin;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Repository\ProviderLead\ProviderLeadRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: ProviderLeadRepository::class)]
#[ORM\Table(name: 'provider_lead')]
#[ORM\HasLifecycleCallbacks]
class ProviderLead
{
    use TimestampableTrait;

    /**
     * `budget_cents` is a PostgreSQL `integer`, so any amount above 2 147 483 647
     * would fail at insert time instead of being rejected. The bound is kept well
     * under that ceiling: no wedding costs a million euros, and the value reaches
     * this entity from client-held onboarding state, never from a trusted source.
     * The frontend clamps to the same bound.
     */
    public const MAX_BUDGET_CENTS = 100_000_000;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Couple::class)]
    #[ORM\JoinColumn(name: 'couple_id', referencedColumnName: 'id', nullable: false)]
    private Couple $couple;

    #[ORM\ManyToOne(targetEntity: Vendor::class)]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false)]
    private Vendor $vendor;

    /**
     * The couple states one budget for the whole wedding, on the last screen of
     * the onboarding, whatever brought them there (WED-108). The lead keeps its
     * own copy rather than reading `Wedding.budgetCents` through the couple: the
     * amount qualifies the request as it stood when the vendor received it, and
     * a couple revising its wedding budget later must not silently rewrite the
     * lead a vendor is already working on.
     */
    #[ORM\Column(name: 'budget_cents', type: 'integer')]
    private int $budgetCents;

    #[ORM\Column(type: 'string', length: 20, enumType: ProviderLeadStatus::class, options: ['default' => 'pending'])]
    private ProviderLeadStatus $status = ProviderLeadStatus::Pending;

    #[ORM\Column(type: 'string', length: 20, enumType: ProviderLeadOrigin::class, options: ['default' => 'wedream'])]
    private ProviderLeadOrigin $origin = ProviderLeadOrigin::Wedream;

    /**
     * La photo « coup de cœur » : celle sur laquelle le couple a cliqué dans la
     * galerie Wedream avant de demander la mise en relation. Elle est portée par
     * le lead parce qu'elle n'est déductible de rien d'autre — un prestataire a
     * plusieurs photos, et sa photo de couverture n'est pas celle que le couple
     * a choisie (PROVIDER-LEAD-004).
     *
     * Nullable : les leads créés avant WED-131 n'en ont pas, et le parcours peut
     * partir d'une demande de contact sans photo.
     */
    #[ORM\ManyToOne(targetEntity: PortfolioImage::class)]
    #[ORM\JoinColumn(name: 'portfolio_image_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?PortfolioImage $portfolioImage = null;

    public function __construct(
        Couple $couple,
        Vendor $vendor,
        int $budgetCents,
        ?PortfolioImage $portfolioImage = null,
    ) {
        if ($budgetCents < 0 || $budgetCents > self::MAX_BUDGET_CENTS) {
            throw new \InvalidArgumentException(sprintf(
                'A provider lead budget must be between 0 and %d cents, %d given.',
                self::MAX_BUDGET_CENTS,
                $budgetCents,
            ));
        }

        // Une photo appartenant à un autre prestataire rendrait la carte du
        // couple incohérente et, une fois la fiche dévoilée, afficherait le
        // travail d'un tiers sous le nom du prestataire contacté.
        if ($portfolioImage !== null && $portfolioImage->getVendor() !== $vendor) {
            throw new \InvalidArgumentException(
                'A provider lead photo must belong to the targeted vendor.',
            );
        }

        $this->couple = $couple;
        $this->vendor = $vendor;
        $this->budgetCents = $budgetCents;
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

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function getBudgetCents(): int
    {
        return $this->budgetCents;
    }

    public function getStatus(): ProviderLeadStatus
    {
        return $this->status;
    }

    public function setStatus(ProviderLeadStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getOrigin(): ProviderLeadOrigin
    {
        return $this->origin;
    }

    public function getPortfolioImage(): ?PortfolioImage
    {
        return $this->portfolioImage;
    }
}
