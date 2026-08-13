<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagType;

use App\DTO\Admin\Vendor\TagValue\AdminTagValueResponseDto;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;

final readonly class AdminTagTypeWithValuesResponseDto
{
    /**
     * @param AdminTagValueResponseDto[] $tagValues
     */
    public function __construct(
        public string $id,
        public string $serviceId,
        public string $label,
        public bool $isPrimary,
        public ?int $maxSelections,
        public bool $isActive,
        public array $tagValues,
    ) {}

    public static function fromEntity(TagType $tagType): self
    {
        return new self(
            id:            $tagType->getId()->toRfc4122(),
            serviceId:     $tagType->getService()->getId()->toRfc4122(),
            label:         $tagType->getLabel(),
            isPrimary:     $tagType->isPrimary(),
            maxSelections: $tagType->getMaxSelections(),
            isActive:      $tagType->isActive(),
            tagValues:     array_map(
                fn(TagValue $tagValue) => AdminTagValueResponseDto::fromEntity($tagValue),
                $tagType->getTagValues()->toArray(),
            ),
        );
    }
}
