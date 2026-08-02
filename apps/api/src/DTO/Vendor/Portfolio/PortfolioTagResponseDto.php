<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Portfolio;

use App\Entity\Vendor\Specialty;
use App\Entity\Wedding\WeddingStyle;

final readonly class PortfolioTagResponseDto
{
    public string $id;
    public string $name;
    public string $slug;

    public function __construct(WeddingStyle|Specialty $tag)
    {
        $this->id   = $tag->getId()->toRfc4122();
        $this->name = $tag->getName();
        $this->slug = $tag->getSlug();
    }

    /**
     * @param array<WeddingStyle|Specialty> $tags
     *
     * @return array<self>
     */
    public static function fromTags(array $tags): array
    {
        return array_map(
            fn(WeddingStyle|Specialty $tag) => new self($tag),
            array_values($tags)
        );
    }
}
