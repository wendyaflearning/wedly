<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VendorProfileStepRequestDto
{
    public function __construct(
        #[Assert\NotNull]
        public array $data = [],
    ) {}
}
