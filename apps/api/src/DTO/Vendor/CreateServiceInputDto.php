<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use App\Enum\Vendor\VendorType;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateServiceInputDto
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 100)]
        public string $name,

        public VendorType $category,

        #[Assert\Uuid]
        public ?string $parentId = null,

        public ?int $sortOrder = null,
    ) {}
}
