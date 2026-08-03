<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\TagValue;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TagValueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TagValue::class);
    }
}
