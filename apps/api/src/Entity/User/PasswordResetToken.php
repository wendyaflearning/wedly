<?php

declare(strict_types=1);

namespace App\Entity\User;

use App\Doctrine\UuidV7Generator;
use App\Enum\User\PasswordResetTokenStatus;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'password_reset_tokens')]
#[ORM\HasLifecycleCallbacks]
class PasswordResetToken
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\Column(name: 'token', length: 64, unique: true)]
    private string $token;

    #[ORM\Column(name: 'status', type: 'string', enumType: PasswordResetTokenStatus::class)]
    private PasswordResetTokenStatus $status;

    #[ORM\Column(name: 'expires_at', type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

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

    public function getStatus(): PasswordResetTokenStatus
    {
        return $this->status;
    }

    public function setStatus(PasswordResetTokenStatus $status): static
    {
        $this->status = $status;

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

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }
}
