<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorAutoTaggedService;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class VendorAutoTaggedServiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VendorAutoTaggedService::class);
    }

    public function findOneByVendorAndService(Vendor $vendor, Service $service): ?VendorAutoTaggedService
    {
        return $this->findOneBy(['vendor' => $vendor, 'service' => $service]);
    }

    /** @return VendorAutoTaggedService[] */
    public function findServicesByVendor(Vendor $vendor): array
    {
        return $this->createQueryBuilder('vats')
            ->select('vats', 'service')
            ->innerJoin('vats.service', 'service')
            ->andWhere('vats.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getResult();
    }
}
