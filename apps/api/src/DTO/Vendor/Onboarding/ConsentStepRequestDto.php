<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConsentStepRequestDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotNull]
        public bool $granted,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            granted: (bool) ($data['granted'] ?? null),
        );
    }
}
