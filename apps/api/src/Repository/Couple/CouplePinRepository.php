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
     * @return CouplePin[]
     */
    public function findByCouple(Couple $couple): array
    {
        return $this->createQueryBuilder('pin')
            ->addSelect('photo')
            ->join('pin.portfolioImage', 'photo')
            ->where('pin.couple = :couple')
            ->setParameter('couple', $couple)
            ->orderBy('pin.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
