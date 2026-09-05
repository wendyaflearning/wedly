<?php

declare(strict_types=1);

namespace App\Service\ProviderLead;

use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\Service;
use App\Service\Vendor\Portfolio\PortfolioImageCategoryResolver;

/**
 * Dérive la catégorie d'une demande de contact (PROVIDER-LEAD-004).
 *
 * La catégorie n'est pas stockée sur le lead : elle est déduite de la photo
 * coup de cœur, via `PortfolioImageCategoryResolver` (même déduction que celle
 * affichée sur une photo de la vitrine Wedream, extraite de cette classe).
 *
 * Lire `Vendor::getServices()` à la place donnerait une autre réponse : la
 * relation est multiple, et elle grandit toute seule quand le prestataire tague
 * de nouvelles photos (`VendorAutoTaggedService`). La catégorie affichée
 * changerait donc après coup pour une demande déjà transmise.
 */
final readonly class ProviderLeadCategoryResolver
{
    public function __construct(
        private PortfolioImageCategoryResolver $photoCategoryResolver,
    ) {}

    public function resolve(ProviderLead $lead): ?Service
    {
        $photo = $lead->getPortfolioImage();
        $fromPhoto = $photo !== null ? $this->photoCategoryResolver->resolve($photo) : null;

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

    private function rootOf(Service $service): Service
    {
        $root = $service;

        while ($root->getParent() !== null) {
            $root = $root->getParent();
        }

        return $root;
    }
}
