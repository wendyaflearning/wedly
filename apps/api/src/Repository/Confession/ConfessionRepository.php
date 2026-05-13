<?php

declare(strict_types=1);

namespace App\Repository\Confession;

use App\Entity\Confession\Confession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class ConfessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Confession::class);
    }
}
