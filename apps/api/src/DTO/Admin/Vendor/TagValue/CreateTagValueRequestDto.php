<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor\TagValue;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateTagValueRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Uuid]
        public string $tagTypeId,

        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public string $label,

        #[Assert\Url]
        #[Assert\Length(max: 512)]
        public ?string $vignetteUrl = null,
    ) {}
}
