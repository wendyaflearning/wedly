<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorDashboardResponseDto
{
    public string $id;
    public string $firstName;
    public ?string $lastname;
    public string $email;
    public string $createdAt;
    public string $vendorType;
    public array $sections_status;
    public int $portfolio_photos_count;
    public bool $portfolio_has_cover;
    public int $booking_blockers_count;
    public ?string $booking_blockers_updated_at;
    public ?string $bio;
    public array $vendorServices;

    public function __construct(
        string $id,
        string $firstName,
        ?string $lastname,
        string $email,
        \DateTimeImmutable $createdAt,
        string $vendorType,
        array $sectionsStatus,
        int $portfolioPhotosCount,
        bool $portfolioHasCover,
        int $bookingBlockersCount,
        ?\DateTimeImmutable $bookingBlockersUpdatedAt,
        ?string $bio,
        array $vendorServices,
    ) {
        $this->id                          = $id;
        $this->firstName                   = $firstName;
        $this->lastname                    = $lastname;
        $this->email                       = $email;
        $this->createdAt                   = $createdAt->format(\DateTimeInterface::ATOM);
        $this->vendorType                  = $vendorType;
        $this->sections_status             = $sectionsStatus;
        $this->portfolio_photos_count      = $portfolioPhotosCount;
        $this->portfolio_has_cover         = $portfolioHasCover;
        $this->booking_blockers_count      = $bookingBlockersCount;
        $this->booking_blockers_updated_at = $bookingBlockersUpdatedAt?->format(\DateTimeInterface::ATOM);
        $this->bio                         = $bio;
        $this->vendorServices              = $vendorServices;
    }
}
