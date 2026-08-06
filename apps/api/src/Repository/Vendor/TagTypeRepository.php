<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\TagType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TagTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TagType::class);
    }

    /**
     * Retourne les TagType actifs d'un service, avec leurs TagValue actives
     * imbriquées (fetch-join, pas de N+1).
     *
     * ⚠️ La collection $tagType->getTagValues() hydratée par cette méthode
     * ne contient QUE les TagValue actives (filtre isActive dans la requête).
     * Ne pas réutiliser pour un contexte ayant besoin de la collection complète
     * (ex. futur CRUD admin TagType/TagValue) — écrire une méthode dédiée.
     *
     * @return TagType[]
     */
    public function findActiveByServiceIdWithValues(string $serviceId): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.tagValues', 'v')
            ->addSelect('v')
            ->where('t.service = :serviceId')
            ->andWhere('t.isActive = true')
            ->andWhere('v.id IS NULL OR v.isActive = true')
            ->setParameter('serviceId', $serviceId)
            ->orderBy('t.label', 'ASC')
            ->addOrderBy('v.label', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
