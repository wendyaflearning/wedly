<?php

declare(strict_types=1);

namespace App\Repository\Couple;

use App\Entity\Couple\Couple;
use App\Entity\User\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Couple>
 */
class CoupleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Couple::class);
    }

    public function findOneByUser(User $user): ?Couple
    {
        return $this->findOneBy(['user' => $user]);
    }
}
