<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorDashboardResponseDto
{
    public string $firstName;
    public string $createdAt;
    public array $steps;

    public function __construct(string $firstName, \DateTimeImmutable $createdAt, array $steps)
    {
        $this->firstName = $firstName;
        $this->createdAt = $createdAt->format(\DateTimeInterface::ATOM);
        $this->steps     = $steps;
    }
}
