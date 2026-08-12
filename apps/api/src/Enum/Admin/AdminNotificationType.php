<?php

declare(strict_types=1);

namespace App\Enum\Admin;

enum AdminNotificationType: string
{
    case ProviderPendingReview = 'provider_pending_review';

    public function label(): string
    {
        return match ($this) {
            self::ProviderPendingReview => 'Nouveau prestataire en attente de validation',
        };
    }
}
