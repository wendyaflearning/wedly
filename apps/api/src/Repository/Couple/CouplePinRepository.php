<?php

declare(strict_types=1);

namespace App\Repository\Couple;

use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CouplePin>
 */
class CouplePinRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CouplePin::class);
    }

    /**
     * Pins of a couple, most recent first.
     *
     * The portfolio image is joined because the assembler reads its URL for every
     * pin — without this, a list of ten pins would trigger ten extra queries.
     *
     * Only Wedream-visible photos are returned (COUPLE-PIN-003): same three
     * conditions as the public gallery, so a vendor opt-out stops serving the
     * image even if the couple_pin row still exists.
     *
     * Pin ids are UUIDv7, so ordering on pin.id DESC is chronological and
     * avoids the second-precision tie on created_at (PortfolioImageRepository
     * uses the same idiom).
     *
     * @return CouplePin[]
     */
    public function findByCouple(Couple $couple): array
    {
        return $this->createQueryBuilder('pin')
            ->addSelect('photo')
            ->join('pin.portfolioImage', 'photo')
            ->innerJoin('photo.vendor', 'vendor')
            ->where('pin.couple = :couple')
            ->andWhere('vendor.isPublished = true')
            ->andWhere('vendor.wedreamEnabled = true')
            ->andWhere('photo.isVisibleInWedream = true')
            ->setParameter('couple', $couple)
            ->orderBy('pin.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
