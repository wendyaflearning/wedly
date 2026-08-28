<?php

declare(strict_types=1);

namespace App\DTO\Couple\Pin;

/**
 * One pinned photo in the couple area (WED-132 / US-6.2).
 *
 * The shape is intentionally minimal: no vendor identity can leak through this
 * object because it has no field that could carry it. Adding one is a visible
 * review choice, not an oversight.
 */
final readonly class CouplePinResponseDto
{
    public string $id;
    public string $portfolioImageId;
    public string $photoUrl;
    public string $pinnedAt;

    public function __construct(
        string $id,
        string $portfolioImageId,
        string $photoUrl,
        \DateTimeImmutable $pinnedAt,
    ) {
        $this->id               = $id;
        $this->portfolioImageId = $portfolioImageId;
        $this->photoUrl         = $photoUrl;
        $this->pinnedAt         = $pinnedAt->format(\DateTimeInterface::ATOM);
    }
}
