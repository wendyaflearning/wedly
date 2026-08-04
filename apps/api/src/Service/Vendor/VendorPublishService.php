<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use Doctrine\ORM\EntityManagerInterface;

final readonly class VendorPublishService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function publish(Vendor $vendor): void
    {
        $vendor->setIsPublished(true);
        $this->em->flush();
    }
}
