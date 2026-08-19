<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagValue;

use App\Entity\Vendor\TagValue;

final readonly class AdminTagValueResponseDto
{
    public function __construct(
        public string $id,
        public string $tagTypeId,
        public string $label,
        public bool $isActive,
        public ?string $vignetteUrl = null,
    ) {}

    public static function fromEntity(TagValue $tagValue): self
    {
        return new self(
            id:          $tagValue->getId()->toRfc4122(),
            tagTypeId:   $tagValue->getTagType()->getId()->toRfc4122(),
            label:       $tagValue->getLabel(),
            isActive:    $tagValue->isActive(),
            vignetteUrl: $tagValue->getVignetteUrl(),
        );
    }
}
