<?php

declare(strict_types=1);

namespace App\Repository\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadStatus;
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

    /**
     * Les demandes reçues par un prestataire, la plus récente d'abord (WED-51).
     *
     * Le couple, son compte et la photo sont joints ici parce que l'assembler
     * les lit pour chaque lead — prénom, coordonnées une fois accepté, date et
     * budget du mariage. Sans ça, dix demandes déclenchent une quarantaine de
     * requêtes. Les tags de la photo restent en lazy loading, pour la même
     * raison que `findByCouple()` : Doctrine ne sait pas fetch-joiner deux
     * collections sans produire un produit cartésien.
     *
     * @return ProviderLead[]
     */
    public function findByVendor(Vendor $vendor): array
    {
        return $this->createQueryBuilder('lead')
            ->addSelect('couple', 'coupleUser', 'wedding', 'photo')
            ->join('lead.couple', 'couple')
            ->join('couple.user', 'coupleUser')
            ->join('couple.wedding', 'wedding')
            ->leftJoin('lead.portfolioImage', 'photo')
            ->where('lead.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->orderBy('lead.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Le badge du dashboard prestataire : combien de demandes attendent encore
     * une décision. Un count SQL plutôt qu'un `count()` sur une collection
     * chargée — le badge n'a besoin d'aucune des lignes.
     */
    public function countPendingByVendor(Vendor $vendor): int
    {
        return (int) $this->createQueryBuilder('lead')
            ->select('COUNT(lead.id)')
            ->where('lead.vendor = :vendor')
            ->andWhere('lead.status = :status')
            ->setParameter('vendor', $vendor)
            ->setParameter('status', ProviderLeadStatus::Pending->value)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
