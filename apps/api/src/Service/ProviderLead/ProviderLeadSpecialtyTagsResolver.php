<?php

declare(strict_types=1);

namespace App\Service\ProviderLead;

use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;

/**
 * Dérive les tags Univers/Spécialité d'une demande de contact (WED-51).
 *
 * Miroir de `ProviderLeadCategoryResolver`, inversé sur le prédicat : la
 * catégorie se lit sur les tags primaires — le métier —, ces tags-ci sur tout le
 * reste, ce qui qualifie la photo sans dire de quel métier elle relève. Les deux
 * partent de la même source, la photo coup de cœur, pour la même raison
 * (PROVIDER-LEAD-004) : `Vendor::getServices()` grandit tout seul quand le
 * prestataire tague de nouvelles photos, et ce qui a été transmis à un
 * prestataire ne doit pas changer après coup.
 *
 * Aucun tag n'est un défaut acceptable : un lead sans photo, ou une photo qui ne
 * porte que des tags primaires, n'a rien à dire de plus que sa catégorie.
 */
final readonly class ProviderLeadSpecialtyTagsResolver
{
    /**
     * @return string[] labels dédoublonnés, triés — jamais null
     */
    public function resolve(ProviderLead $lead): array
    {
        return $this->resolveFromPhoto($lead->getPortfolioImage());
    }

    /**
     * @return string[]
     */
    private function resolveFromPhoto(?PortfolioImage $image): array
    {
        if ($image === null) {
            return [];
        }

        $labels = [];

        /** @var TagValue $tag */
        foreach ($image->getTags() as $tag) {
            if ($tag->getTagType()->isPrimary()) {
                continue;
            }

            $label = $tag->getLabel();

            // Deux TagType non primaires peuvent porter le même label — « Bohème »
            // en Univers et en Style. Le prestataire lirait la valeur deux fois.
            if (!in_array($label, $labels, true)) {
                $labels[] = $label;
            }
        }

        // Même exigence que le `usort` du resolver de catégorie : l'ordre
        // d'insertion des tags ne doit pas décider de ce qu'affiche un email
        // déjà parti.
        sort($labels);

        return $labels;
    }
}
