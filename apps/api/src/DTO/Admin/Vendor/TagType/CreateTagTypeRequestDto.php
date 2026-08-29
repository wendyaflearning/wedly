<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagType;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateTagTypeRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $serviceId,

        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public string $label,

        public bool $isPrimary,

        public ?int $maxSelections,
    ) {}
}
