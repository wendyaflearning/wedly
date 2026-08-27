<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Enum\Vendor\VendorEmailLogStatus;
use App\Enum\Vendor\VendorEmailType;
use App\Repository\Vendor\VendorEmailLogRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: VendorEmailLogRepository::class)]
#[ORM\Table(name: 'vendor_email_log')]
#[ORM\Index(name: 'IDX_vendor_email_log_lookup', columns: ['vendor_id', 'type', 'status'])]
#[ORM\HasLifecycleCallbacks]
class VendorEmailLog
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Vendor::class)]
    #[ORM\JoinColumn(name: 'vendor_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Vendor $vendor;

    #[ORM\Column(name: 'type', type: 'string', length: 30, enumType: VendorEmailType::class)]
    private VendorEmailType $type;

    #[ORM\Column(name: 'status', type: 'string', length: 30, enumType: VendorEmailLogStatus::class)]
    private VendorEmailLogStatus $status;

    #[ORM\Column(name: 'error_message', type: 'text', nullable: true)]
    private ?string $errorMessage = null;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function setVendor(Vendor $vendor): static
    {
        $this->vendor = $vendor;

        return $this;
    }

    public function getType(): VendorEmailType
    {
        return $this->type;
    }

    public function setType(VendorEmailType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getStatus(): VendorEmailLogStatus
    {
        return $this->status;
    }

    public function setStatus(VendorEmailLogStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getErrorMessage(): ?string
    {
        return $this->errorMessage;
    }

    public function setErrorMessage(?string $errorMessage): static
    {
        $this->errorMessage = $errorMessage;

        return $this;
    }
}
