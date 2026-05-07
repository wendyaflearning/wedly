<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PortfolioImage>
 */
class PortfolioImageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PortfolioImage::class);
    }

    /** @return PortfolioImage[] */
    public function findByVendor(Vendor $vendor): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getResult();
    }
}
