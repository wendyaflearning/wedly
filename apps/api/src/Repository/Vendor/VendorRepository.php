<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Vendor>
 */
class VendorRepository extends ServiceEntityRepository
{
    private const ADMIN_REVIEW_STATUSES = [
        'under_review',
        'active',
        'rejected',
    ];

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

    /** @return Vendor[] */
    public function findForAdminReview(?VendorStatus $status): array
    {
        $qb = $this->createQueryBuilder('vendor')
            ->addSelect('user')
            ->leftJoin('vendor.user', 'user')
            ->leftJoin('vendor.services', 'service')
            ->addSelect('service')
            ->orderBy('COALESCE(vendor.submittedForReviewAt, vendor.updatedAt)', 'DESC');

        if ($status !== null) {
            $qb->andWhere('vendor.status = :status')
                ->setParameter('status', $status->value);
        } else {
            $qb->andWhere('vendor.status IN (:statuses)')
                ->setParameter('statuses', self::ADMIN_REVIEW_STATUSES);
        }

        return $qb->getQuery()->getResult();
    }

    public function countAdminReviewableVendors(): int
    {
        return (int) $this->createQueryBuilder('vendor')
            ->select('COUNT(vendor.id)')
            ->andWhere('vendor.status IN (:statuses)')
            ->setParameter('statuses', self::ADMIN_REVIEW_STATUSES)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findAdminProfile(string $id): ?Vendor
    {
        return $this->createQueryBuilder('vendor')
            ->addSelect('user', 'service', 'culture', 'confession', 'region', 'portfolio', 'venueDetails', 'cateringDetails')
            ->leftJoin('vendor.user', 'user')
            ->leftJoin('vendor.services', 'service')
            ->leftJoin('vendor.cultures', 'culture')
            ->leftJoin('vendor.confessions', 'confession')
            ->leftJoin('vendor.regions', 'region')
            ->leftJoin('vendor.portfolioImages', 'portfolio')
            ->leftJoin('vendor.venueDetails', 'venueDetails')
            ->leftJoin('vendor.cateringDetails', 'cateringDetails')
            ->andWhere('vendor.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
