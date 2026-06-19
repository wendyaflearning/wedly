<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorDashboardResponseDto
{
    public string $firstName;
    public ?string $lastname;

    public string $email;
    public string $createdAt;
    public array $steps;

    public function __construct(string $firstName, ?string $lastname, string $email, \DateTimeImmutable $createdAt, array $steps)
    {
        $this->firstName = $firstName;
        $this->lastname =  $lastname;
        $this->email =     $email;
        $this->createdAt = $createdAt->format(\DateTimeInterface::ATOM);
        $this->steps     = $steps;

    }
}
