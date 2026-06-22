<?php

declare(strict_types=1);

namespace App\DTO\BookingBlocker;

use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

final readonly class BookingBlockerRequestDto
{
    public function __construct(
        #[Context(denormalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
        public \DateTimeImmutable $date_start,

        #[Context(denormalizationContext: [DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
        public \DateTimeImmutable $date_end,
    ) {}

    #[Assert\Callback]
    public function validateDateRange(ExecutionContextInterface $context): void
    {
        $today   = new \DateTimeImmutable('today');
        $maxDate = $today->modify('+12 months');

        if ($this->date_start > $this->date_end) {
            $context->buildViolation('La date de début doit être antérieure ou égale à la date de fin.')
                ->atPath('date_start')
                ->addViolation();
        }

        if ($this->date_start < $today) {
            $context->buildViolation('La date de début ne peut pas être dans le passé.')
                ->atPath('date_start')
                ->addViolation();
        }

        if ($this->date_end > $maxDate) {
            $context->buildViolation('La date de fin ne peut pas dépasser 12 mois à partir d\'aujourd\'hui.')
                ->atPath('date_end')
                ->addViolation();
        }
    }
}
