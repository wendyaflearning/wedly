<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\BookingBlocker\BookingBlocker;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorConsent;
use App\Enum\User\InviteTokenPersona;
use App\Enum\Vendor\ConsentType;
use App\Enum\Vendor\VendorStatus;
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

    /** @return Vendor[] */
    public function findForAdminReview(?VendorStatus $status): array
    {
        $qb = $this->createQueryBuilder('vendor')
            ->addSelect('user')
            ->leftJoin('vendor.user', 'user')
            ->leftJoin('vendor.services', 'service')
            ->addSelect('service')
            ->orderBy('vendor.submittedForReviewAt', 'DESC')
            ->addOrderBy('vendor.updatedAt', 'DESC');

        if ($status !== null) {
            $qb->andWhere('vendor.status = :status')
                ->setParameter('status', $status->value);
        } else {
            $qb->andWhere('vendor.status IN (:statuses)')
                ->setParameter('statuses', VendorStatus::adminReviewValues());
        }

        return $qb->getQuery()->getResult();
    }

    public function countAdminReviewableVendors(): int
    {
        return (int) $this->createQueryBuilder('vendor')
            ->select('COUNT(vendor.id)')
            ->andWhere('vendor.status IN (:statuses)')
            ->setParameter('statuses', VendorStatus::adminReviewValues())
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Vendor[] */
    public function findAdminDrafts(): array
    {
        return $this->createQueryBuilder('vendor')
            ->addSelect('user', 'service')
            ->leftJoin('vendor.user', 'user')
            ->leftJoin('vendor.services', 'service')
            ->leftJoin(InviteToken::class, 'inviteToken', 'WITH', 'inviteToken.vendor = vendor AND inviteToken.persona = :persona')
            ->andWhere('vendor.status = :status')
            ->andWhere('inviteToken.id IS NULL')
            ->setParameter('status', VendorStatus::Pending->value)
            ->setParameter('persona', InviteTokenPersona::Vendor->value)
            ->orderBy('vendor.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findAdminProfile(string $id): ?Vendor
    {
        return $this->createQueryBuilder('vendor')
            ->addSelect('user', 'portfolio', 'tags', 'venueDetails', 'cateringDetails')
            ->leftJoin('vendor.user', 'user')
            ->leftJoin('vendor.portfolioImages', 'portfolio')
            ->leftJoin('portfolio.tags', 'tags')
            ->leftJoin('vendor.venueDetails', 'venueDetails')
            ->leftJoin('vendor.cateringDetails', 'cateringDetails')
            ->andWhere('vendor.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function hasPortfolioCoverByVendor(Vendor $vendor): bool
    {
        return (int) $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(p.id)')
            ->from(PortfolioImage::class, 'p')
            ->where('p.vendor = :vendor')
            ->andWhere('p.isCover = :isCover')
            ->setParameter('vendor', $vendor)
            ->setParameter('isCover', true)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }

    public function findLatestMatchingConsent(Vendor $vendor): ?bool
    {
        // id (UuidV7) tie-break si collision infra-seconde — risque accepté, pas de lock.
        $consent = $this->getEntityManager()
            ->getRepository(VendorConsent::class)
            ->findOneBy(
                ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
                ['createdAt' => 'DESC', 'id' => 'DESC'],
            );

        return $consent?->isGranted();
    }

    /** @return BookingBlocker[] */
    public function findBookingBlockersByVendor(Vendor $vendor): array
    {
        return $this->getEntityManager()
            ->createQueryBuilder()
            ->select('b')
            ->from(BookingBlocker::class, 'b')
            ->where('b.vendor = :vendor')
            ->orderBy('b.startDate', 'ASC')
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getResult();
    }

    public function findLatestBookingBlockerUpdatedAt(Vendor $vendor): ?\DateTimeImmutable
    {
        /** @var BookingBlocker|null $blocker */
        $blocker = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('b')
            ->from(BookingBlocker::class, 'b')
            ->where('b.vendor = :vendor')
            ->orderBy('b.updatedAt', 'DESC')
            ->setMaxResults(1)
            ->setParameter('vendor', $vendor)
            ->getQuery()
            ->getOneOrNullResult();

        return $blocker?->getUpdatedAt();
    }
}
