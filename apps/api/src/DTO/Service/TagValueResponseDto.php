<?php

declare(strict_types=1);

namespace App\DTO\Service;

use App\Entity\Vendor\TagValue;

final readonly class TagValueResponseDto
{
    public function __construct(
        public string $id,
        public string $label,
        public ?string $vignetteUrl = null,
    ) {}

    public static function fromEntity(TagValue $tagValue): self
    {
        return new self(
            id:          $tagValue->getId()->toRfc4122(),
            label:       $tagValue->getLabel(),
            vignetteUrl: $tagValue->getVignetteUrl(),
        );
    }
}
