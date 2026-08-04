<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\Service;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class ServiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Service::class);
    }

    /** @return Service[] */
    public function findRootsWithChildren(): array
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.children', 'c')
            ->addSelect('c')
            ->leftJoin('c.children', 'gc')
            ->addSelect('gc')
            ->where('s.parent IS NULL')
            ->orderBy('s.sortOrder', 'ASC')
            ->addOrderBy('c.sortOrder', 'ASC')
            ->addOrderBy('gc.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findMaxSortOrder(): ?int
    {
        return $this->createQueryBuilder('s')
            ->select('MAX(s.sortOrder)')
            ->getQuery()
            ->getSingleScalarResult();
    }
}
