<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorDashboardResponseDto
{
    public string $firstName;
    public ?string $lastName;

    public string $email;
    public string $status;
    public string $createdAt;
    public array $steps;

    public function __construct(
        string $firstName,
        ?string $lastName,
        string $email,
        string $status,
        \DateTimeImmutable $createdAt,
        array $steps,
    ) {
        $this->firstName = $firstName;
        $this->lastName  = $lastName;
        $this->email     = $email;
        $this->status    = $status;
        $this->createdAt = $createdAt->format(\DateTimeInterface::ATOM);
        $this->steps     = $steps;
    }
}
