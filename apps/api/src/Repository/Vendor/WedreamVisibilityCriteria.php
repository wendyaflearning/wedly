<?php

declare(strict_types=1);

namespace App\Repository\Vendor;

use Doctrine\ORM\QueryBuilder;

/**
 * Définition unique de « publié dans Wedream » (WED-193).
 *
 * Trois conditions, vraies ensemble :
 *
 * - le prestataire a publié sa fiche (`vendor.isPublished`) ;
 * - il a gardé sa vitrine Wedream active (`vendor.wedreamEnabled`) ;
 * - la photo elle-même est marquée visible (`portfolioImage.isVisibleInWedream`).
 *
 * C'est la même porte pour la lecture publique de la galerie
 * (WEDREAM-VISIBILITY-001), la lecture des épinglés d'un couple (COUPLE-PIN-003)
 * et l'écriture d'un épingle ou d'une demande de contact
 * (`VendorResolver::findVisiblePortfolioImage()`). Une seule source de vérité,
 * pour qu'aucun chemin ne puisse en inventer une autre et créer une ligne
 * invisible.
 *
 * La méthode ne pose aucun `join` : chaque appelant amène déjà la photo et son
 * prestataire dans le `QueryBuilder`, sous les alias qu'il choisit, et ne passe
 * ici que pour la clause de visibilité.
 */
final class WedreamVisibilityCriteria
{
    public static function apply(QueryBuilder $qb, string $photoAlias, string $vendorAlias): void
    {
        $qb->andWhere(sprintf('%s.isPublished = true', $vendorAlias))
            ->andWhere(sprintf('%s.wedreamEnabled = true', $vendorAlias))
            ->andWhere(sprintf('%s.isVisibleInWedream = true', $photoAlias));
    }
}
