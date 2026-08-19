<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagValue;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class UpdateTagValueRequestDto
{
    public function __construct(
        #[Assert\Length(min: 1, max: 100)]
        public ?string $label = null,

        #[Assert\Url]
        #[Assert\Length(max: 512)]
        public ?string $vignetteUrl = null,
    ) {}
}
