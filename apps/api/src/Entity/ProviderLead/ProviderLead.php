<?php

declare(strict_types=1);

namespace App\Entity\ProviderLead;

use App\Doctrine\UuidV7Generator;
use App\Entity\Couple\Couple;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadOrigin;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
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

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $unlocked = true;

    #[ORM\Column(type: 'string', length: 20, enumType: ProviderLeadOrigin::class, options: ['default' => 'wedream'])]
    private ProviderLeadOrigin $origin = ProviderLeadOrigin::Wedream;

    public function __construct(Couple $couple, Vendor $vendor, int $budgetCents)
    {
        if ($budgetCents < 0 || $budgetCents > self::MAX_BUDGET_CENTS) {
            throw new \InvalidArgumentException(sprintf(
                'A provider lead budget must be between 0 and %d cents, %d given.',
                self::MAX_BUDGET_CENTS,
                $budgetCents,
            ));
        }

        $this->couple = $couple;
        $this->vendor = $vendor;
        $this->budgetCents = $budgetCents;
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

    public function isUnlocked(): bool
    {
        return $this->unlocked;
    }

    public function setUnlocked(bool $unlocked): static
    {
        $this->unlocked = $unlocked;

        return $this;
    }

    public function getOrigin(): ProviderLeadOrigin
    {
        return $this->origin;
    }
}
