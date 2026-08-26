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

    /**
     * Retourne TOUS les TagType d'un service (actifs et inactifs), avec TOUTES leurs
     * TagValue imbriquées (actives et inactives, fetch-join, pas de N+1).
     *
     * Réservée aux contextes admin ayant besoin de la collection complète
     * (cf. docblock de findActiveByServiceIdWithValues() pour la version filtrée).
     *
     * @return TagType[]
     */
    public function findAllByServiceIdWithValues(string $serviceId): array
    {
        return $this->createQueryBuilder('t')
            ->leftJoin('t.tagValues', 'v')
            ->addSelect('v')
            ->where('t.service = :serviceId')
            ->setParameter('serviceId', $serviceId)
            ->orderBy('t.label', 'ASC')
            ->addOrderBy('v.label', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne le TagType is_primary=true et is_active=true d'un service, s'il existe.
     * Utilisé pour la contrainte CA4 (un seul axe principal actif par service).
     */
    public function findOneActivePrimaryByService(string $serviceId): ?TagType
    {
        return $this->createQueryBuilder('t')
            ->where('t.service = :serviceId')
            ->andWhere('t.isPrimary = true')
            ->andWhere('t.isActive = true')
            ->setParameter('serviceId', $serviceId)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
