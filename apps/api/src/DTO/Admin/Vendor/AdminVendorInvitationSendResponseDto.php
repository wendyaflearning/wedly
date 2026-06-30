<?php

declare(strict_types=1);

namespace App\DTO\Admin\Vendor;

use App\Entity\User\InviteToken;
use App\Entity\Vendor\Vendor;

final readonly class AdminVendorInvitationSendResponseDto
{
    public string $vendorId;
    public string $inviteToken;
    public string $invitationUrl;
    public bool $emailSent;

    public function __construct(Vendor $vendor, InviteToken $inviteToken, string $frontendUrl, bool $emailSent)
    {
        $this->vendorId       = $vendor->getId()->toRfc4122();
        $this->inviteToken    = $inviteToken->getToken();
        $this->invitationUrl  = rtrim($frontendUrl, '/') . '/onboarding/' . $inviteToken->getToken();
        $this->emailSent      = $emailSent;
    }
}
