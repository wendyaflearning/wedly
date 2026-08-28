<?php

declare(strict_types=1);

namespace App\Tests\Unit\Command\Admin;

use App\Command\Admin\DeleteUserCommand;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Admin\UserDeleteService;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Uid\UuidV7;

/**
 * UserDeleteService est `final readonly` : PHPUnit ne peut pas le doubler. Les tests
 * instancient donc le vrai service avec une Connection mockée, et vérifient la suppression
 * via les appels à executeStatement()/commit() plutôt qu'un mock de service.
 */
final class DeleteUserCommandTest extends TestCase
{
    private const EMAIL = 'lucas@example.fr';

    public function test_it_deletes_without_prompting_when_run_non_interactively_with_force(): void
    {
        $user = $this->makeUser();

        $connection = $this->createMock(Connection::class);
        $connection->expects($this->once())->method('beginTransaction');
        $connection->expects($this->once())->method('executeStatement')
            ->with('DELETE FROM app_user WHERE id = :userId', ['userId' => $user->getId()->toRfc4122()]);
        $connection->expects($this->once())->method('commit');

        $tester = $this->makeTester($user, null, $connection);

        self::assertSame(Command::SUCCESS, $tester->execute(
            ['email' => self::EMAIL, '--force' => true],
            ['interactive' => false],
        ));
        self::assertStringContainsString('have been deleted', $tester->getDisplay());
    }

    public function test_it_still_asks_for_confirmation_when_interactive_and_honors_a_refusal(): void
    {
        $user = $this->makeUser();

        $connection = $this->createMock(Connection::class);
        $connection->expects($this->never())->method('beginTransaction');
        $connection->expects($this->never())->method('executeStatement');

        $tester = $this->makeTester($user, null, $connection);
        $tester->setInputs(['n']);

        self::assertSame(Command::SUCCESS, $tester->execute(
            ['email' => self::EMAIL, '--force' => true],
            ['interactive' => true],
        ));
        self::assertStringContainsString('Deletion cancelled', $tester->getDisplay());
    }

    public function test_dry_run_never_deletes(): void
    {
        $user = $this->makeUser();

        $connection = $this->createMock(Connection::class);
        $connection->expects($this->never())->method('beginTransaction');
        $connection->expects($this->never())->method('executeStatement');

        $tester = $this->makeTester($user, null, $connection);

        self::assertSame(Command::SUCCESS, $tester->execute(['email' => self::EMAIL]));
        self::assertStringContainsString('Dry-run mode', $tester->getDisplay());
    }

    private function makeTester(User $user, ?Vendor $vendor, Connection $connection): CommandTester
    {
        $userRepository = $this->createStub(UserRepository::class);
        $userRepository->method('findOneBy')->with(['email' => self::EMAIL])->willReturn($user);

        $vendorRepository = $this->createStub(VendorRepository::class);
        $vendorRepository->method('findOneByUser')->willReturn($vendor);

        $command = new DeleteUserCommand($userRepository, $vendorRepository, new UserDeleteService($connection));

        $application = new Application();
        $application->addCommand($command);

        return new CommandTester($application->find('app:user:delete'));
    }

    private function makeUser(): User
    {
        $user = (new User())
            ->setFirstName('Lucas')
            ->setEmail(self::EMAIL)
            ->setPassword('password');
        (new \ReflectionProperty($user, 'id'))->setValue($user, new UuidV7());

        return $user;
    }
}
