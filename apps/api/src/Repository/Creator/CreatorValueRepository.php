<?php

declare(strict_types=1);

namespace App\Repository\Creator;

use App\Entity\Creator\CreatorValue;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class CreatorValueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CreatorValue::class);
    }
}
