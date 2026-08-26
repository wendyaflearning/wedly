<?php

declare(strict_types=1);

namespace App\DTO\Public\PortfolioImage;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;

/**
 * Représentation publique d'une photo de la galerie Wedream.
 *
 * Contrat volontairement distinct de PortfolioImageResponseDto (dashboard prestataire) :
 * aucune identité de prestataire ni donnée d'administration n'y transite.
 */
final readonly class PublicPortfolioImageResponseDto
{
    public string $id;
    public string $url;

    /** @var array<string, string[]> clé = label du TagType, valeurs = labels des TagValue */
    public array $tagsByGroup;

    public function __construct(PortfolioImage $image)
    {
        $this->id  = $image->getId()->toRfc4122();
        $this->url = $image->getUrl();

        $tagsByGroup = [];
        /** @var TagValue $tag */
        foreach ($image->getTags() as $tag) {
            $tagsByGroup[$tag->getTagType()->getLabel()][] = $tag->getLabel();
        }

        $this->tagsByGroup = $tagsByGroup;
    }
}
