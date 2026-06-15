<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;

final readonly class ExperiencesRequestDto implements DTOInterface
{
    public function __construct(
        public ?array $cultureIds,
        public ?array $confessionIds,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            cultureIds:    array_key_exists('culture_ids', $data)    ? $data['culture_ids']    : null,
            confessionIds: array_key_exists('confession_ids', $data) ? $data['confession_ids'] : null,
        );
    }
}
