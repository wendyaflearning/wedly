<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Couple;

use App\Entity\Couple\Couple;
use App\Entity\User\User;
use App\Repository\Couple\CoupleRepository;
use App\Service\Couple\CoupleFromJwtResolver;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * WED-194 : la résolution du couple depuis le JWT vivait, dupliquée, dans les
 * trois actions « pins » (WED-132 / WED-155 / WED-183). Elle est désormais
 * testée pour elle-même — seuls `Security` et le repository sont doublés.
 */
final class CoupleFromJwtResolverTest extends TestCase
{
    public function test_returns_the_couple_bound_to_the_authenticated_user(): void
    {
        $user   = new User();
        $couple = new Couple();

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($user);

        $repository = $this->createMock(CoupleRepository::class);
        $repository->expects($this->once())
            ->method('findOneByUser')
            ->with($user)
            ->willReturn($couple);

        self::assertSame($couple, (new CoupleFromJwtResolver($security, $repository))->resolve());
    }

    public function test_returns_null_when_no_couple_is_bound_to_the_user(): void
    {
        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn(new User());

        $repository = $this->createStub(CoupleRepository::class);
        $repository->method('findOneByUser')->willReturn(null);

        self::assertNull((new CoupleFromJwtResolver($security, $repository))->resolve());
    }

    public function test_returns_null_and_skips_the_repository_when_the_token_carries_no_app_user(): void
    {
        $security = $this->createStub(Security::class);
        // Un principal qui n'est pas notre entité User (jeton absent ou d'un autre type).
        $security->method('getUser')->willReturn($this->createStub(UserInterface::class));

        $repository = $this->createMock(CoupleRepository::class);
        $repository->expects($this->never())->method('findOneByUser');

        self::assertNull((new CoupleFromJwtResolver($security, $repository))->resolve());
    }
}
