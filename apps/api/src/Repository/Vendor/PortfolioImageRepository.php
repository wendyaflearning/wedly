<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\UuidV7;

/**
 * @extends ServiceEntityRepository<PortfolioImage>
 */
class PortfolioImageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PortfolioImage::class);
    }

    /** @return PortfolioImage[] */
    public function findByVendor(Vendor $vendor): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.vendor = :vendor')
            ->setParameter('vendor', $vendor)
            ->orderBy('p.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Page publique de la galerie Wedream pour un sous-style donné.
     *
     * Une photo n'est publiée que si le prestataire a activé sa visibilité Wedream
     * (`v.wedreamEnabled`) ET que la photo elle-même est marquée visible
     * (`p.isVisibleInWedream`) : taguer ne publie plus à lui seul.
     *
     * L'id étant un UUIDv7, il est trié chronologiquement : ordonner sur p.id DESC
     * équivaut à un createdAt DESC et rend le curseur suffisant à lui seul
     * (pas de tie-breaker nécessaire).
     *
     * @return PortfolioImage[]
     */
    public function findPublicByTagValue(TagValue $tagValue, ?UuidV7 $cursor, int $limit): array
    {
        $qb = $this->createQueryBuilder('p')
            ->innerJoin('p.vendor', 'v')
            ->innerJoin('p.tags', 't')
            ->where('t = :tagValue')
            ->andWhere('v.isPublished = true')
            ->andWhere('v.wedreamEnabled = true')
            ->andWhere('p.isVisibleInWedream = true')
            ->setParameter('tagValue', $tagValue)
            ->orderBy('p.id', 'DESC')
            ->setMaxResults($limit);

        if ($cursor !== null) {
            $qb->andWhere('p.id < :cursor')
                ->setParameter('cursor', $cursor, 'uuid');
        }

        /** @var PortfolioImage[] $images */
        $images = $qb->getQuery()->getResult();

        $this->hydrateTags($images);

        return $images;
    }

    public function countByTagValue(TagValue $tagValue): int
    {
        return (int) $this->createQueryBuilder('p')
            ->select('COUNT(DISTINCT p.id)')
            ->innerJoin('p.vendor', 'v')
            ->innerJoin('p.tags', 't')
            ->where('t = :tagValue')
            ->andWhere('v.isPublished = true')
            ->andWhere('v.wedreamEnabled = true')
            ->andWhere('p.isVisibleInWedream = true')
            ->setParameter('tagValue', $tagValue)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Charge en une seule requête les tags et leur TagType pour les images de la page.
     *
     * Doctrine réutilise les entités déjà en identity map : les collections `tags`
     * des images passées en argument s'en trouvent initialisées, ce qui évite le N+1
     * à la construction de `tagsByGroup`. On ne peut pas fetch-joindre directement
     * dans la requête paginée : un join to-many fausserait le setMaxResults.
     *
     * @param PortfolioImage[] $images
     */
    private function hydrateTags(array $images): void
    {
        if ($images === []) {
            return;
        }

        $this->createQueryBuilder('p')
            ->select('p', 't', 'tt')
            ->leftJoin('p.tags', 't')
            ->leftJoin('t.tagType', 'tt')
            ->where('p.id IN (:ids)')
            ->setParameter('ids', array_map(
                static fn(PortfolioImage $image) => $image->getId()->toRfc4122(),
                $images,
            ))
            ->getQuery()
            ->getResult();
    }
}
