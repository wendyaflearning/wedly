<?php

declare(strict_types=1);

namespace App\DTO\BookingBlocker;

use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

final readonly class BookingBlockerRequestDto
{
    public function __construct(
        #[Context(denormalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
        public \DateTimeImmutable $date_start,

        #[Context(denormalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
        public \DateTimeImmutable $date_end,
    ) {}
}
