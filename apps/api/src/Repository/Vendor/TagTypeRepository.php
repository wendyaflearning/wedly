<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\TagType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TagTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TagType::class);
    }

    /** @return TagType[] */
    public function findActiveByServiceIdWithValues(string $serviceId): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.tagValues', 'v')
            ->addSelect('v')
            ->where('t.service = :serviceId')
            ->andWhere('t.isActive = true')
            ->andWhere('v.id IS NULL OR v.isActive = true')
            ->setParameter('serviceId', $serviceId)
            ->orderBy('t.label', 'ASC')
            ->addOrderBy('v.label', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
