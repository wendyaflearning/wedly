<?php

declare(strict_types=1);

namespace App\Entity\Wedding;

use App\Doctrine\UuidV7Generator;
use App\Enum\Couple\ConsentType;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
#[ORM\Table(name: 'wedding_consent')]
#[ORM\HasLifecycleCallbacks]
class WeddingConsent
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\ManyToOne(targetEntity: Wedding::class)]
    #[ORM\JoinColumn(name: 'wedding_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Wedding $wedding;

    #[ORM\Column(type: 'string', enumType: ConsentType::class)]
    private ConsentType $consentType;

    #[ORM\Column]
    private bool $granted;

    public function __construct(Wedding $wedding, ConsentType $consentType, bool $granted)
    {
        $this->wedding = $wedding;
        $this->consentType = $consentType;
        $this->granted = $granted;
    }

    public function getId(): UuidV7 { return $this->id; }
    public function getWedding(): Wedding { return $this->wedding; }
    public function getConsentType(): ConsentType { return $this->consentType; }
    public function isGranted(): bool { return $this->granted; }
}
