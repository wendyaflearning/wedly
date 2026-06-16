<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Vendor>
 */
class VendorRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Vendor::class);
    }

    public function findOneByUser(User $user): ?Vendor
    {
        return $this->findOneBy(['user' => $user]);
    }

    public function countBookingBlockersByVendor(Vendor $vendor): int
    {
        return (int) $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(b.id)')
            ->from(BookingBlocker::class, 'b')
            ->where('b.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countPortfolioImagesByVendor(Vendor $vendor): int
    {
        return (int) $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(p.id)')
            ->from(PortfolioImage::class, 'p')
            ->where('p.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
