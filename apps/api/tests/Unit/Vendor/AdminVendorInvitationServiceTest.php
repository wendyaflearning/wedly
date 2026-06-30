<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\User\InviteToken;
use App\Repository\User\InviteTokenRepository;
use App\Service\Vendor\AdminVendorInvitationService;
use PHPUnit\Framework\TestCase;

final class AdminVendorInvitationServiceTest extends TestCase
{
    public function test_list_returns_active_vendor_invitations(): void
    {
        $now = new \DateTimeImmutable('2026-06-26 10:00:00');
        $activeInvitations = [new InviteToken()];
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->once())
            ->method('findActiveVendorInvitations')
            ->with($now)
            ->willReturn($activeInvitations);
        $repository->expects($this->never())->method('findExpiredVendorInvitations');

        self::assertSame($activeInvitations, (new AdminVendorInvitationService($repository))->list('active', $now));
    }

    public function test_list_returns_expired_vendor_invitations(): void
    {
        $now = new \DateTimeImmutable('2026-06-26 10:00:00');
        $expiredInvitations = [new InviteToken()];
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->once())
            ->method('findExpiredVendorInvitations')
            ->with($now)
            ->willReturn($expiredInvitations);
        $repository->expects($this->never())->method('findActiveVendorInvitations');

        self::assertSame($expiredInvitations, (new AdminVendorInvitationService($repository))->list('expired', $now));
    }

    public function test_list_rejects_invalid_scope(): void
    {
        $repository = $this->createMock(InviteTokenRepository::class);
        $repository->expects($this->never())->method('findActiveVendorInvitations');
        $repository->expects($this->never())->method('findExpiredVendorInvitations');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Invalid invitation scope.');

        (new AdminVendorInvitationService($repository))->list('all');
    }
}
