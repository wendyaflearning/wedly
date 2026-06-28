<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Enum\Vendor\ConsentType;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'vendor_consent')]
#[ORM\HasLifecycleCallbacks]
class VendorConsent
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

    #[ORM\Column(type: 'string', enumType: ConsentType::class)]
    private ConsentType $consentType;

    #[ORM\Column]
    private bool $granted;

    public function __construct(Vendor $vendor, ConsentType $consentType, bool $granted)
    {
        $this->vendor      = $vendor;
        $this->consentType = $consentType;
        $this->granted     = $granted;
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function getConsentType(): ConsentType
    {
        return $this->consentType;
    }

    public function isGranted(): bool
    {
        return $this->granted;
    }

    public function setGranted(bool $granted): void
    {
        $this->granted = $granted;
    }
}
