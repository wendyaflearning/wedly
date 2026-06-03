<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreatorUniverseDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotNull(message: 'Les valeurs sont requises')]
        #[Assert\Type('array')]
        #[Assert\Count(min: 1, max: 3, minMessage: 'Au moins une valeur est requise', maxMessage: '3 valeurs maximum')]
        public array $creatorValueIds,

        #[Assert\NotNull(message: 'L\'atelier fixe est requis')]
        public bool $hasFixedWorkshop,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            creatorValueIds:  $data['creator_value_ids'] ?? [],
            hasFixedWorkshop: $data['has_fixed_workshop'] ?? false,
        );
    }
}
