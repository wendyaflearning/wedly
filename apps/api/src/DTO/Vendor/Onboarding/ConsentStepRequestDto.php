<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Onboarding;

use App\DTO\DTOInterface;

final readonly class ConsentStepRequestDto implements DTOInterface
{
    public function __construct(
        public bool $granted,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            granted: array_key_exists('granted', $data)
                ? (is_bool($data['granted'])
                    ? $data['granted']
                    : throw new \DomainException('Le champ "granted" doit être un booléen natif.', 422))
                : throw new \DomainException('Le champ "granted" est requis.', 422),
        );
    }
}
