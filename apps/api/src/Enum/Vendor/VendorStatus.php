<?php

declare(strict_types=1);

namespace App\Enum\Vendor;

enum VendorStatus: string
{
    case Pending     = 'pending';
    case UnderReview = 'under_review';
    case Active      = 'active';
    case Rejected    = 'rejected';

    /** @return self[] */
    public static function adminReviewStatuses(): array
    {
        return [
            self::UnderReview,
            self::Active,
            self::Rejected,
        ];
    }

    /** @return string[] */
    public static function adminReviewValues(): array
    {
        return array_map(static fn(self $status): string => $status->value, self::adminReviewStatuses());
    }

    public static function fromAdminFilter(?string $status): self|false|null
    {
        if ($status === 'all') {
            return null;
        }

        $vendorStatus = self::tryFrom($status ?? self::UnderReview->value);
        if ($vendorStatus === null) {
            return false;
        }

        return in_array($vendorStatus, self::adminReviewStatuses(), true) ? $vendorStatus : false;
    }
}
