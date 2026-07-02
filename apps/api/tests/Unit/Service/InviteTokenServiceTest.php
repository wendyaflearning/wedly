<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\User\InviteToken;
use App\Enum\User\InviteTokenStatus;
use App\Service\InviteTokenService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;

final class InviteTokenServiceTest extends TestCase
{
    public function test_resolve_returns_pending_token_found_by_token_value(): void
    {
        $inviteToken = (new InviteToken())
            ->setStatus(InviteTokenStatus::Pending)
            ->setExpiresAt(new \DateTimeImmutable('+1 day'));

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['token' => 'invite-token-123'])
            ->willReturn($inviteToken);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('getRepository')
            ->with(InviteToken::class)
            ->willReturn($repository);

        $service = new InviteTokenService($em);

        $this->assertSame($inviteToken, $service->resolve('invite-token-123'));
    }

    public function test_resolve_throws_404_when_token_does_not_exist(): void
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['token' => 'missing-token'])
            ->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('getRepository')
            ->with(InviteToken::class)
            ->willReturn($repository);

        $service = new InviteTokenService($em);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Token invalide');

        $service->resolve('missing-token');
    }

    public function test_resolve_throws_410_when_token_is_not_pending(): void
    {
        $inviteToken = (new InviteToken())
            ->setStatus(InviteTokenStatus::Used)
            ->setExpiresAt(new \DateTimeImmutable('+1 day'));

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['token' => 'used-token'])
            ->willReturn($inviteToken);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('getRepository')
            ->with(InviteToken::class)
            ->willReturn($repository);

        $service = new InviteTokenService($em);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(410);
        $this->expectExceptionMessage('Token déjà utilisé');

        $service->resolve('used-token');
    }

    public function test_resolve_expires_past_pending_token_and_flushes_changes(): void
    {
        $inviteToken = (new InviteToken())
            ->setStatus(InviteTokenStatus::Pending)
            ->setExpiresAt(new \DateTimeImmutable('-1 minute'));

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['token' => 'expired-token'])
            ->willReturn($inviteToken);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('getRepository')
            ->with(InviteToken::class)
            ->willReturn($repository);
        $em->expects($this->once())->method('flush');

        $service = new InviteTokenService($em);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(410);
        $this->expectExceptionMessage('Token expiré');

        try {
            $service->resolve('expired-token');
        } finally {
            $this->assertSame(InviteTokenStatus::Expired, $inviteToken->getStatus());
        }
    }

    public function test_consume_marks_token_as_used_and_flushes_changes(): void
    {
        $inviteToken = (new InviteToken())->setStatus(InviteTokenStatus::Pending);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $service = new InviteTokenService($em);

        $service->consume($inviteToken);

        $this->assertSame(InviteTokenStatus::Used, $inviteToken->getStatus());
    }
}
