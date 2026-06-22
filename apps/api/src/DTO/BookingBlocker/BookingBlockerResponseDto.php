<?php

declare(strict_types=1);

namespace App\DTO\BookingBlocker;

use App\Entity\BookingBlocker\BookingBlocker;

final readonly class BookingBlockerResponseDto
{
    public string $id;
    public string $date_start;
    public string $date_end;

    public function __construct(BookingBlocker $blocker)
    {
        $this->id         = $blocker->getId()->toRfc4122();
        $this->date_start = $blocker->getStartDate()->format('Y-m-d');
        $this->date_end   = $blocker->getEndDate()->format('Y-m-d');
    }
}
