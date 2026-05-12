<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class VendorOnboardingStepRequestDto
{
    public function __construct(
        #[Assert\NotBlank]
        public string $step,

        #[Assert\NotNull]
        public ?array $data,
    ) {}
}
