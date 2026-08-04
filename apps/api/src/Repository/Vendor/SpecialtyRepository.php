<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\Specialty;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SpecialtyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Specialty::class);
    }

    /** @return Specialty[] */
    public function findAllOrderedBySortOrder(): array
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.service', 'sv')
            ->addSelect('sv')
            ->andWhere('s.isActive = true')
            ->orderBy('s.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
