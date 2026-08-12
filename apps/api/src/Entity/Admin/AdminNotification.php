<?php

declare(strict_types=1);

namespace App\Entity\Admin;

use App\Doctrine\UuidV7Generator;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Admin\AdminNotificationType;
use App\Repository\Admin\AdminNotificationRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: AdminNotificationRepository::class)]
#[ORM\Table(name: 'admin_notification')]
#[ORM\Index(name: 'idx_admin_notification_recipient_created_at', columns: ['recipient_id', 'created_at'])]
#[ORM\Index(name: 'idx_admin_notification_recipient_read_at', columns: ['recipient_id', 'read_at'])]
#[ORM\HasLifecycleCallbacks]
class AdminNotification
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'recipient_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $recipient;

    #[ORM\ManyToOne(targetEntity: Vendor::class)]
    #[ORM\JoinColumn(name: 'provider_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Vendor $provider;

    #[ORM\Column(name: 'type', type: 'string', length: 80, enumType: AdminNotificationType::class)]
    private AdminNotificationType $type;

    #[ORM\Column(name: 'payload', type: 'json')]
    private array $payload = [];

    #[ORM\Column(name: 'read_at', type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $readAt = null;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getRecipient(): User
    {
        return $this->recipient;
    }

    public function setRecipient(User $recipient): static
    {
        $this->recipient = $recipient;

        return $this;
    }

    public function getProvider(): Vendor
    {
        return $this->provider;
    }

    public function setProvider(Vendor $provider): static
    {
        $this->provider = $provider;

        return $this;
    }

    public function getType(): AdminNotificationType
    {
        return $this->type;
    }

    public function setType(AdminNotificationType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function setPayload(array $payload): static
    {
        $this->payload = $payload;

        return $this;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->readAt;
    }

    public function markAsRead(?\DateTimeImmutable $readAt = null): static
    {
        $this->readAt = $readAt ?? new \DateTimeImmutable();

        return $this;
    }

    public function isRead(): bool
    {
        return $this->readAt !== null;
    }
}
