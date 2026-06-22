<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;

final readonly class AdminVendorListItemResponseDto
{
    public string $id;
    public string $name;
    public string $vendorType;
    public string $vendorTypeLabel;
    public array $services;
    public string $submittedAt;
    public string $status;
    public string $statusLabel;

    public function __construct(Vendor $vendor)
    {
        $submittedAt = $vendor->getSubmittedForReviewAt() ?? $vendor->getUpdatedAt();
        $vendorType  = $vendor->resolveVendorType();

        $this->id              = $vendor->getId()->toRfc4122();
        $this->name            = $vendor->getBrandName();
        $this->vendorType      = $vendorType->value;
        $this->vendorTypeLabel = self::vendorTypeLabel($vendorType);
        $this->services        = array_map(
            fn(Service $service) => $service->getName(),
            $vendor->getServices()->toArray()
        );
        $this->submittedAt = $submittedAt->format(\DateTimeInterface::ATOM);
        $this->status      = $vendor->getStatus()->value;
        $this->statusLabel = self::statusLabel($vendor->getStatus());
    }

    public static function vendorTypeLabel(VendorType $type): string
    {
        return match ($type) {
            VendorType::Freelance => 'Freelance',
            VendorType::Createurs => 'Créateur',
            VendorType::Traiteur  => 'Traiteur',
            VendorType::Lieu      => 'Lieu',
        };
    }

    public static function statusLabel(VendorStatus $status): string
    {
        return match ($status) {
            VendorStatus::Pending,
            VendorStatus::UnderReview => 'En attente',
            VendorStatus::Active      => 'Validé',
            VendorStatus::Rejected    => 'Refusé',
        };
    }
}
