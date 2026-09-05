<?php

declare(strict_types=1);

namespace App\Service\Vendor\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagValue;

/**
 * Dérive le métier d'un prestataire à partir d'une de ses photos publiques.
 *
 * Extrait de `ProviderLeadCategoryResolver` (PROVIDER-LEAD-004) : la même
 * déduction sert désormais aussi à afficher le métier sur une photo de la
 * vitrine Wedream (home) — un contexte qui n'a rien à voir avec une demande de
 * mise en relation. Une photo n'est cliquable côté couple que si elle porte un
 * tag primaire (`PortfolioService::updatePortfolioTags`), et un `TagType`
 * appartient à exactement un `Service` : toute photo affichée porte donc une
 * catégorie déterminée.
 */
final readonly class PortfolioImageCategoryResolver
{
    public function resolve(PortfolioImage $image): ?Service
    {
        /** @var Service[] $services */
        $services = [];

        /** @var TagValue $tag */
        foreach ($image->getTags() as $tag) {
            $tagType = $tag->getTagType();

            if (!$tagType->isPrimary()) {
                continue;
            }

            $root = $this->rootOf($tagType->getService());

            if (!in_array($root, $services, true)) {
                $services[] = $root;
            }
        }

        if ($services === []) {
            return null;
        }

        // Rien n'interdit formellement à une photo de porter des tags primaires
        // de deux services : `assertMaxSelectionsRespected` ne borne que par
        // TagType. Le tri par `sort_order` puis par slug rend le choix
        // déterministe plutôt que dépendant de l'ordre d'insertion des tags.
        usort($services, static fn(Service $a, Service $b) => [$a->getSortOrder(), $a->getSlug()]
            <=> [$b->getSortOrder(), $b->getSlug()]);

        return $services[0];
    }

    /**
     * Le métier affiché est la racine, pas le sous-service : un `Service` peut
     * avoir un parent (`Service::getParent()`).
     */
    private function rootOf(Service $service): Service
    {
        $root = $service;

        while ($root->getParent() !== null) {
            $root = $root->getParent();
        }

        return $root;
    }
}
