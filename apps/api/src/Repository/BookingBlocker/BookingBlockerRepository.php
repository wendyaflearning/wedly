<?php

declare(strict_types=1);

namespace App\Repository\BookingBlocker;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\Vendor\Vendor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BookingBlocker>
 */
class BookingBlockerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BookingBlocker::class);
    }

    public function findByVendor(Vendor $vendor): array
    {
        return $this->findBy(['vendor' => $vendor], ['startDate' => 'ASC']);
    }

    public function findOverlapping(Vendor $vendor, \DateTimeImmutable $start, \DateTimeImmutable $end): array
    {
        return $this->createQueryBuilder('b')
            ->where('b.vendor = :vendor')
            ->andWhere('b.startDate <= :end')
            ->andWhere('b.endDate >= :start')
            ->setParameter('vendor', $vendor)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->getQuery()
            ->getResult();
    }
}
