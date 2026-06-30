<?php

declare(strict_types=1);

namespace App\Tests\Unit\InviteToken;

use App\Entity\User\InviteToken;
use App\Enum\User\InviteTokenStatus;
use App\Service\InviteTokenService;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class InviteTokenServiceTest extends TestCase
{
    public function test_resolve_returns_pending_non_expired_token(): void
    {
        $inviteToken = $this->makeInviteToken(InviteTokenStatus::Pending, new \DateTimeImmutable('+1 day'));
        $entityManager = $this->makeEntityManager($inviteToken);
        $entityManager->expects($this->never())->method('flush');

        self::assertSame($inviteToken, (new InviteTokenService($entityManager))->resolve('valid-token'));
    }

    public function test_resolve_rejects_used_token(): void
    {
        $inviteToken = $this->makeInviteToken(InviteTokenStatus::Used, new \DateTimeImmutable('+1 day'));
        $entityManager = $this->makeEntityManager($inviteToken);
        $entityManager->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(410);
        $this->expectExceptionMessage('Token déjà utilisé');

        (new InviteTokenService($entityManager))->resolve('used-token');
    }

    public function test_resolve_marks_pending_expired_token_as_expired_then_rejects_it(): void
    {
        $inviteToken = $this->makeInviteToken(InviteTokenStatus::Pending, new \DateTimeImmutable('-1 minute'));
        $entityManager = $this->makeEntityManager($inviteToken);
        $entityManager->expects($this->once())->method('flush');

        try {
            (new InviteTokenService($entityManager))->resolve('expired-token');
            self::fail('Expected expired token to be rejected.');
        } catch (\DomainException $exception) {
            self::assertSame(410, $exception->getCode());
            self::assertSame('Token expiré', $exception->getMessage());
            self::assertSame(InviteTokenStatus::Expired, $inviteToken->getStatus());
        }
    }

    private function makeInviteToken(InviteTokenStatus $status, \DateTimeImmutable $expiresAt): InviteToken
    {
        return (new InviteToken())
            ->setToken('token')
            ->setStatus($status)
            ->setExpiresAt($expiresAt);
    }

    private function makeEntityManager(?InviteToken $inviteToken): EntityManagerInterface&\PHPUnit\Framework\MockObject\MockObject
    {
        $repository = $this->createStub(EntityRepository::class);
        $repository->method('findOneBy')->willReturn($inviteToken);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->method('getRepository')->with(InviteToken::class)->willReturn($repository);

        return $entityManager;
    }
}
