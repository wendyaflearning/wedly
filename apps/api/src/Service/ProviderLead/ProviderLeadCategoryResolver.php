<?php

declare(strict_types=1);

namespace App\Service\ProviderLead;

use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagValue;

/**
 * Dérive la catégorie d'une demande de contact (PROVIDER-LEAD-004).
 *
 * La catégorie n'est pas stockée sur le lead : elle est déduite de la photo
 * coup de cœur. Le parcours de découverte Wedream part d'un sous-style
 * (`GET /api/v1/tag-values/{id}/portfolio-images`), une photo n'y est visible
 * que si elle porte un tag primaire (`PortfolioService::updatePortfolioTags`),
 * et un `TagType` appartient à exactement un `Service` : toute photo cliquable
 * par un couple porte donc une catégorie déterminée.
 *
 * Lire `Vendor::getServices()` à la place donnerait une autre réponse : la
 * relation est multiple, et elle grandit toute seule quand le prestataire tague
 * de nouvelles photos (`VendorAutoTaggedService`). La catégorie affichée
 * changerait donc après coup pour une demande déjà transmise.
 */
final readonly class ProviderLeadCategoryResolver
{
    public function resolve(ProviderLead $lead): ?Service
    {
        $fromPhoto = $this->resolveFromPhoto($lead->getPortfolioImage());

        if ($fromPhoto !== null) {
            return $fromPhoto;
        }

        // Lead sans photo — créé avant WED-131, ou demande de contact partie
        // d'ailleurs que de la galerie. Un prestataire mono-service ne laisse
        // aucune ambiguïté ; au-delà, aucune catégorie n'est plus légitime
        // qu'une autre et la carte n'en affiche pas.
        $services = $lead->getVendor()->getServices();

        return $services->count() === 1 ? $this->rootOf($services->first()) : null;
    }

    private function resolveFromPhoto(?PortfolioImage $image): ?Service
    {
        if ($image === null) {
            return null;
        }

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
     * La carte du couple affiche le métier, pas le sous-service : un `Service`
     * peut avoir un parent (`Service::getParent()`).
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
