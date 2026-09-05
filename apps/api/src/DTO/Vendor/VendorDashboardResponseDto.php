<?php

declare(strict_types=1);

namespace App\DTO\Vendor;

final readonly class VendorDashboardResponseDto
{
    public string $id;
    public string $firstName;
    public ?string $lastName;
    public string $email;
    public string $status;
    public string $createdAt;
    public string $vendorType;
    public array $sections_status;
    public ?bool $consent_granted;
    public int $portfolio_photos_count;
    public bool $portfolio_has_cover;
    public int $booking_blockers_count;
    public ?string $booking_blockers_updated_at;
    public ?string $bio;
    public array $vendorServices;
    public bool $wedream_enabled;
    public bool $is_published;
    /**
     * Le badge « demandes en attente » du dashboard (WED-51). Rafraîchi à la
     * lecture du dashboard, pas en temps réel : le prestataire le découvre en se
     * connectant, l'email l'ayant déjà prévenu.
     */
    public int $pendingLeadsCount;

    public function __construct(
        string $id,
        string $firstName,
        ?string $lastName,
        string $email,
        string $status,
        \DateTimeImmutable $createdAt,
        string $vendorType,
        array $sectionsStatus,
        ?bool $consentGranted,
        int $portfolioPhotosCount,
        bool $portfolioHasCover,
        int $bookingBlockersCount,
        ?\DateTimeImmutable $bookingBlockersUpdatedAt,
        ?string $bio,
        array $vendorServices,
        bool $wedreamEnabled,
        bool $isPublished,
        int $pendingLeadsCount,
    ) {
        $this->id                          = $id;
        $this->firstName                   = $firstName;
        $this->lastName                    = $lastName;
        $this->email                       = $email;
        $this->status                      = $status;
        $this->createdAt                   = $createdAt->format(\DateTimeInterface::ATOM);
        $this->vendorType                  = $vendorType;
        $this->sections_status             = $sectionsStatus;
        $this->consent_granted             = $consentGranted;
        $this->portfolio_photos_count      = $portfolioPhotosCount;
        $this->portfolio_has_cover         = $portfolioHasCover;
        $this->booking_blockers_count      = $bookingBlockersCount;
        $this->booking_blockers_updated_at = $bookingBlockersUpdatedAt?->format(\DateTimeInterface::ATOM);
        $this->bio                         = $bio;
        $this->vendorServices              = $vendorServices;
        $this->wedream_enabled             = $wedreamEnabled;
        $this->is_published                = $isPublished;
        $this->pendingLeadsCount           = $pendingLeadsCount;
    }
}
