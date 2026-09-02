<?php

declare(strict_types=1);

namespace App\Repository\Couple;

use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
use App\Repository\Vendor\WedreamVisibilityCriteria;
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
     * Only Wedream-visible photos are returned (COUPLE-PIN-003): the exact same
     * clause as the public gallery and as the write path, through the single
     * WedreamVisibilityCriteria definition (WED-193), so a vendor opt-out stops
     * serving the image even if the couple_pin row still exists.
     *
     * Pin ids are UUIDv7, so ordering on pin.id DESC is chronological and
     * avoids the second-precision tie on created_at (PortfolioImageRepository
     * uses the same idiom).
     *
     * Unpinned rows are filtered out (WED-183). This method feeds both « Mes
     * épinglés » and the gallery's SSR read, so a photo the couple unpinned
     * disappears from the two at once.
     *
     * @return CouplePin[]
     */
    public function findByCouple(Couple $couple): array
    {
        $qb = $this->createQueryBuilder('pin')
            ->addSelect('photo')
            ->join('pin.portfolioImage', 'photo')
            ->innerJoin('photo.vendor', 'vendor')
            ->where('pin.couple = :couple')
            ->andWhere('pin.isActive = true')
            ->setParameter('couple', $couple)
            ->orderBy('pin.id', 'DESC');

        WedreamVisibilityCriteria::apply($qb, 'photo', 'vendor');

        return $qb->getQuery()->getResult();
    }

    /**
     * The one row a couple can hold for a photo, active or not (WED-183).
     *
     * Deliberately unfiltered on isActive: the unique constraint allows a single
     * row per (couple, photo) for good, so re-pinning has to find the deactivated
     * row to revive it, and DELETE has to find it to stay idempotent.
     */
    public function findOneByCoupleAndPortfolioImageId(Couple $couple, string $portfolioImageId): ?CouplePin
    {
        return $this->createQueryBuilder('pin')
            ->where('pin.couple = :couple')
            ->andWhere('pin.portfolioImage = :portfolioImage')
            ->setParameter('couple', $couple)
            ->setParameter('portfolioImage', $portfolioImageId, 'uuid')
            ->getQuery()
            ->getOneOrNullResult();
    }
}
