<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\User\InviteToken;

final readonly class AdminVendorInvitationListResponseDto
{
    public array $items;
    public int $total;

    /** @param InviteToken[] $inviteTokens */
    public function __construct(array $inviteTokens)
    {
        $this->items = array_map(fn(InviteToken $inviteToken) => new AdminVendorInvitationResponseDto($inviteToken), $inviteTokens);
        $this->total = count($inviteTokens);
    }
}
