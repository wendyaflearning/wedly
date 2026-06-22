<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Enum\Vendor\VendorRejectionReason;

final readonly class RejectVendorRequestDto
{
    /** @param VendorRejectionReason[] $reasons */
    private function __construct(
        public array $reasons,
        public ?string $note,
    ) {}

    public static function fromArray(array $data): self
    {
        $reasonValues = $data['reasons'] ?? null;
        if (!is_array($reasonValues) || $reasonValues === []) {
            throw new \DomainException('At least one rejection reason is required.', 422);
        }

        $reasons = [];
        foreach ($reasonValues as $reasonValue) {
            if (!is_string($reasonValue)) {
                throw new \DomainException('Invalid rejection reason.', 422);
            }

            $reason = VendorRejectionReason::tryFrom($reasonValue);
            if ($reason === null) {
                throw new \DomainException(sprintf('Unknown rejection reason: %s.', $reasonValue), 422);
            }

            $reasons[] = $reason;
        }

        $note = isset($data['note']) && is_string($data['note']) ? trim($data['note']) : null;
        if ($note === '') {
            $note = null;
        }

        if (!in_array(VendorRejectionReason::Other, $reasons, true) && $note !== null) {
            throw new \DomainException('A note can only be provided with the "other" reason.', 422);
        }

        return new self($reasons, $note);
    }
}
