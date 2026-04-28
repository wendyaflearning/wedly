<?php

declare(strict_types=1);

namespace App\Entity\User;

use App\Doctrine\UuidV7Generator;
use App\Entity\Couple\Couple;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'invite_tokens')]
#[ORM\HasLifecycleCallbacks]
class InviteToken
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\Column(name: 'token', length: 128, unique: true)]
    private string $token;

    #[ORM\Column(name: 'persona', type: 'string', enumType: InviteTokenPersona::class)]
    private InviteTokenPersona $persona;

    #[ORM\Column(name: 'status', type: 'string', enumType: InviteTokenStatus::class)]
    private InviteTokenStatus $status;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Vendor::class)]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Vendor $vendor = null;

    #[ORM\ManyToOne(targetEntity: Couple::class)]
    #[ORM\JoinColumn(name: 'couple_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Couple $couple = null;

    #[ORM\Column(name: 'expires_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;

        return $this;
    }

    public function getPersona(): InviteTokenPersona
    {
        return $this->persona;
    }

    public function setPersona(InviteTokenPersona $persona): static
    {
        $this->persona = $persona;

        return $this;
    }

    public function getStatus(): InviteTokenStatus
    {
        return $this->status;
    }

    public function setStatus(InviteTokenStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getVendor(): ?Vendor
    {
        return $this->vendor;
    }

    public function setVendor(?Vendor $vendor): static
    {
        $this->vendor = $vendor;

        return $this;
    }

    public function getCouple(): ?Couple
    {
        return $this->couple;
    }

    public function setCouple(?Couple $couple): static
    {
        $this->couple = $couple;

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
