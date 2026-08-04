<?php

declare(strict_types=1);

namespace App\DTO\Style;

use App\Entity\Wedding\WeddingStyle;

final readonly class StyleResponseDto
{
    public string $id;
    public string $name;
    public string $slug;

    public function __construct(WeddingStyle $style)
    {
        $this->id   = $style->getId()->toString();
        $this->name = $style->getName();
        $this->slug = $style->getSlug();
    }
}
