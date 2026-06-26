<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\User\InviteToken;
use App\Repository\User\InviteTokenRepository;

final readonly class AdminVendorInvitationService
{
    public function __construct(private InviteTokenRepository $inviteTokenRepository) {}

    /** @return InviteToken[] */
    public function list(string $scope, ?\DateTimeImmutable $now = null): array
    {
        if (!in_array($scope, ['active', 'expired'], true)) {
            throw new \DomainException('Invalid invitation scope.', 422);
        }

        $now ??= new \DateTimeImmutable();

        return $scope === 'expired'
            ? $this->inviteTokenRepository->findExpiredVendorInvitations($now)
            : $this->inviteTokenRepository->findActiveVendorInvitations($now);
    }
}
