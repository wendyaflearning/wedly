<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagType;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class UpdateTagTypeRequestDto
{
    public function __construct(
        #[Assert\Length(min: 1, max: 100)]
        public ?string $label = null,

        public ?int $maxSelections = null,
    ) {}
}
