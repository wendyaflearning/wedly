<?php

declare(strict_types=1);

namespace App\Entity;

use App\Doctrine\UuidV7Generator;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\SubscriptionStatus;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'subscription')]
#[ORM\HasLifecycleCallbacks]
class Subscription
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Couple::class)]
    #[ORM\JoinColumn(name: 'couple_id', referencedColumnName: 'id', nullable: false)]
    private Couple $couple;

    #[ORM\ManyToOne(targetEntity: Plan::class)]
    #[ORM\JoinColumn(name: 'plan_id', referencedColumnName: 'id', nullable: false)]
    private Plan $plan;

    #[ORM\Column(name: 'stripe_id', length: 255, nullable: true)]
    private ?string $stripeId = null;

    #[ORM\Column(name: 'status', type: 'string', enumType: SubscriptionStatus::class)]
    private SubscriptionStatus $status;

    #[ORM\Column(name: 'amount_paid_cents', type: 'integer')]
    private int $amountPaidCents;

    #[ORM\Column(name: 'expires_at')]
    private \DateTimeImmutable $expiresAt;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getCouple(): Couple
    {
        return $this->couple;
    }

    public function setCouple(Couple $couple): static
    {
        $this->couple = $couple;

        return $this;
    }

    public function getPlan(): Plan
    {
        return $this->plan;
    }

    public function setPlan(Plan $plan): static
    {
        $this->plan = $plan;

        return $this;
    }

    public function getStripeId(): ?string
    {
        return $this->stripeId;
    }

    public function setStripeId(?string $stripeId): static
    {
        $this->stripeId = $stripeId;

        return $this;
    }

    public function getStatus(): SubscriptionStatus
    {
        return $this->status;
    }

    public function setStatus(SubscriptionStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getAmountPaidCents(): int
    {
        return $this->amountPaidCents;
    }

    public function setAmountPaidCents(int $amountPaidCents): static
    {
        $this->amountPaidCents = $amountPaidCents;

        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }
}
