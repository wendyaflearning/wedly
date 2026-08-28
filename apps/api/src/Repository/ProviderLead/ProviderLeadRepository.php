<?php

declare(strict_types=1);

namespace App\Repository\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ProviderLead>
 */
class ProviderLeadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProviderLead::class);
    }

    /**
     * Les demandes d'un couple, la plus récente d'abord.
     *
     * Le prestataire et la photo sont joints ici parce que l'assembler les lit
     * pour chaque lead : sans ça, une liste de dix demandes déclenche vingt
     * requêtes supplémentaires. Les tags de la photo restent en lazy loading —
     * ils ne sont lus que pour dériver la catégorie, et Doctrine ne sait pas
     * fetch-joiner deux collections sans produire un produit cartésien.
     *
     * @return ProviderLead[]
     */
    public function findByCouple(Couple $couple): array
    {
        return $this->createQueryBuilder('lead')
            ->addSelect('vendor', 'photo')
            ->join('lead.vendor', 'vendor')
            ->leftJoin('lead.portfolioImage', 'photo')
            ->where('lead.couple = :couple')
            ->setParameter('couple', $couple)
            ->orderBy('lead.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
