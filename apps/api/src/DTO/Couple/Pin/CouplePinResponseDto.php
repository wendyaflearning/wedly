<?php

declare(strict_types=1);

namespace App\DTO\Couple\Pin;

/**
 * One pinned photo in the couple area (WED-132 / US-6.2, WED-197).
 *
 * `vendorId` is an opaque correlation UUID — same rationale as
 * `PublicPortfolioImageResponseDto` (PROVIDER-LEAD-009): it lets the couple
 * area show the real contact status without exposing a vendor profile.
 */
final readonly class CouplePinResponseDto
{
    public string $id;
    public string $portfolioImageId;
    public string $photoUrl;
    public string $pinnedAt;

    /** @var array<string, string[]> clé = label du TagType, valeurs = labels des TagValue */
    public array $tagsByGroup;

    /** Identifiant opaque de corrélation — voir le docblock de la classe. */
    public string $vendorId;

    public function __construct(
        string $id,
        string $portfolioImageId,
        string $photoUrl,
        \DateTimeImmutable $pinnedAt,
        string $vendorId,
        array $tagsByGroup,
    ) {
        $this->id               = $id;
        $this->portfolioImageId = $portfolioImageId;
        $this->photoUrl         = $photoUrl;
        $this->pinnedAt         = $pinnedAt->format(\DateTimeInterface::ATOM);
        $this->vendorId         = $vendorId;
        $this->tagsByGroup      = $tagsByGroup;
    }
}
