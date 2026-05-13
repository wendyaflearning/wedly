<?php

declare(strict_types=1);

namespace App\Repository\Culture;

use App\Entity\Culture\Culture;
use App\Enum\Wedding\CultureType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

final class CultureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Culture::class);
    }

    public function findContinents(): array
    {
        return $this->findBy(['type' => CultureType::Continent]);
    }
}
