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

    /**
     * Recherche une TagValue par label pour une TagType donnée, actif ou non
     * (un doublon inactif compte quand même comme doublon).
     * $excludeId permet d'ignorer la TagValue en cours d'édition.
     */
    public function findOneByLabelAndTagType(string $tagTypeId, string $label, ?string $excludeId = null): ?TagValue
    {
        $qb = $this->createQueryBuilder('v')
            ->where('v.tagType = :tagTypeId')
            ->andWhere('LOWER(v.label) = LOWER(:label)')
            ->setParameter('tagTypeId', $tagTypeId)
            ->setParameter('label', $label)
            ->setMaxResults(1);

        if ($excludeId !== null) {
            $qb->andWhere('v.id != :excludeId')
                ->setParameter('excludeId', $excludeId);
        }

        return $qb->getQuery()->getOneOrNullResult();
    }
}
