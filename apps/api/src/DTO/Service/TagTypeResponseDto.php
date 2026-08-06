<?php

declare(strict_types=1);

namespace App\DTO\Service;

use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;

final readonly class TagTypeResponseDto
{
    public function __construct(
        public string $id,
        public string $label,
        public bool $isPrimary,
        public ?int $maxSelections,
        public array $tagValues,
    ) {}

    public static function fromEntity(TagType $tagType): self
    {
        return new self(
            id:            $tagType->getId()->toRfc4122(),
            label:         $tagType->getLabel(),
            isPrimary:     $tagType->isPrimary(),
            maxSelections: $tagType->getMaxSelections(),
            tagValues:     array_map(
                fn(TagValue $tagValue) => TagValueResponseDto::fromEntity($tagValue),
                $tagType->getTagValues()->toArray(),
            ),
        );
    }
}
