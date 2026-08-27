<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorEmailLog;
use App\Enum\Vendor\VendorEmailLogStatus;
use App\Enum\Vendor\VendorEmailType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VendorEmailLog>
 */
class VendorEmailLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VendorEmailLog::class);
    }

    public function hasBeenSuccessfullySent(Vendor $vendor, VendorEmailType $type): bool
    {
        return (int) $this->createQueryBuilder('vendorEmailLog')
            ->select('COUNT(vendorEmailLog.id)')
            ->andWhere('vendorEmailLog.vendor = :vendor')
            ->andWhere('vendorEmailLog.type = :type')
            ->andWhere('vendorEmailLog.status = :successStatus')
            ->setParameter('vendor', $vendor)
            ->setParameter('type', $type->value)
            ->setParameter('successStatus', VendorEmailLogStatus::Success->value)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }
}
