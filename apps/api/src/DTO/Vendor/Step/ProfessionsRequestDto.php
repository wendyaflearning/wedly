<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ProfessionsRequestDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotBlank(message: 'Au moins un service est requis')]
        #[Assert\Type('array')]
        public array $serviceIds,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            serviceIds: $data['service_ids'] ?? [],
        );
    }
}
