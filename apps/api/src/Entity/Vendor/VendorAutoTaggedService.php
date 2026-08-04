<?php

declare(strict_types=1);

namespace App\Entity\Vendor;

use App\Doctrine\UuidV7Generator;
use App\Repository\Vendor\VendorAutoTaggedServiceRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: VendorAutoTaggedServiceRepository::class)]
#[ORM\Table(name: 'vendor_auto_tagged_service')]
#[ORM\UniqueConstraint(name: 'UNIQ_vendor_auto_tagged_service', columns: ['vendor_id', 'service_id'])]
#[ORM\HasLifecycleCallbacks]
class VendorAutoTaggedService
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

    #[ORM\ManyToOne(targetEntity: Service::class)]
    #[ORM\JoinColumn(name: 'service_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Service $service;

    public function __construct(Vendor $vendor, Service $service)
    {
        $this->vendor  = $vendor;
        $this->service = $service;
    }

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getVendor(): Vendor
    {
        return $this->vendor;
    }

    public function getService(): Service
    {
        return $this->service;
    }
}
