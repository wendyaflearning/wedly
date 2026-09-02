<?php

declare(strict_types=1);

namespace App\DTO\Public\PortfolioImage;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;

/**
 * Représentation publique d'une photo de la galerie Wedream.
 *
 * Contrat volontairement distinct de PortfolioImageResponseDto (dashboard
 * prestataire) : aucun nom, aucune bio, aucune coordonnée, aucun portfolio
 * complet, aucune donnée d'administration n'y transite.
 *
 * `vendorId` est la seule exception, et c'est un choix, pas une fuite : un UUID
 * opaque, qui ne désigne personne tant qu'aucun endpoint ne le traduit en nom —
 * et aucun ne le fait, la résolution d'un prestataire par son id étant réservée
 * à l'admin et au prestataire lui-même. Il existe pour que le couple connecté
 * retrouve, sur n'importe quelle photo d'un prestataire, le statut réel d'une
 * demande qu'il lui a déjà envoyée (PROVIDER-LEAD-009). Sans lui, deux photos du
 * même prestataire sont deux inconnus, et le couple relit « demande envoyée »
 * sur celui qui vient de refuser.
 *
 * Ce que l'identifiant donne à un visiteur anonyme se limite à regrouper les
 * photos publiques par prestataire — sans savoir lequel.
 */
final readonly class PublicPortfolioImageResponseDto
{
    public string $id;
    public string $url;

    /** @var array<string, string[]> clé = label du TagType, valeurs = labels des TagValue */
    public array $tagsByGroup;

    /** Identifiant opaque de corrélation — voir le docblock de la classe. */
    public string $vendorId;

    public function __construct(PortfolioImage $image)
    {
        $this->id  = $image->getId()->toRfc4122();
        $this->url = $image->getUrl();
        $this->vendorId = $image->getVendor()->getId()->toRfc4122();

        $tagsByGroup = [];
        /** @var TagValue $tag */
        foreach ($image->getTags() as $tag) {
            $tagsByGroup[$tag->getTagType()->getLabel()][] = $tag->getLabel();
        }

        $this->tagsByGroup = $tagsByGroup;
    }
}
