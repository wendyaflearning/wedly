<?php

declare(strict_types=1);

namespace App\Event;

final readonly class VendorOnboardingSubmittedEvent
{
    public function __construct(
        public string $vendorId,
        public string $firstName,
        public string $lastName,
        public string $email,
        public string $brand,
        public string $category,
        public array $regions,
        public ?\DateTimeImmutable $submittedForReviewAt,
        public bool $isFirstSubmission,
    ) {}
}
