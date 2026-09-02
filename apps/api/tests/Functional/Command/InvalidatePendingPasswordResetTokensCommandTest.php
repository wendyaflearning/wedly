<?php

declare(strict_types=1);

namespace App\Tests\Functional\Command;

use App\Entity\User\PasswordResetToken;
use App\Entity\User\User;
use App\Enum\User\PasswordResetTokenStatus;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;

/**
 * La commande écrit en masse sur des données de production le jour où on la
 * lance : ce test vérifie qu'elle périme bien tout ce qui est `Pending`, et
 * surtout qu'elle ne touche à rien d'autre.
 *
 * Fonctionnel plutôt qu'unitaire parce que le cœur de la commande est une
 * requête DQL : la doubler ne testerait que le mock, pas la requête.
 */
final class InvalidatePendingPasswordResetTokensCommandTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Connection $connection;

    protected function setUp(): void
    {
        self::bootKernel();

        $this->em         = static::getContainer()->get(EntityManagerInterface::class);
        $this->connection = $this->em->getConnection();
        $this->connection->beginTransaction();
    }

    protected function tearDown(): void
    {
        if ($this->connection->isTransactionActive()) {
            $this->connection->rollBack();
        }

        parent::tearDown();
    }

    public function test_it_invalidates_every_pending_token_and_leaves_the_others_alone(): void
    {
        $user = $this->createUser();

        $firstPending  = $this->createToken($user, PasswordResetTokenStatus::Pending);
        $secondPending = $this->createToken($user, PasswordResetTokenStatus::Pending);
        $alreadyUsed   = $this->createToken($user, PasswordResetTokenStatus::Used);

        $tester = $this->runCommand();

        self::assertSame(Command::SUCCESS, $tester->getStatusCode());
        self::assertStringContainsString('2 pending password reset token(s) invalidated', $tester->getDisplay());

        $this->em->clear();

        self::assertSame(PasswordResetTokenStatus::Used, $this->reload($firstPending)->getStatus());
        self::assertSame(PasswordResetTokenStatus::Used, $this->reload($secondPending)->getStatus());
        self::assertSame(PasswordResetTokenStatus::Used, $this->reload($alreadyUsed)->getStatus());
    }

    public function test_it_reports_plainly_when_there_is_nothing_to_invalidate(): void
    {
        $tester = $this->runCommand();

        self::assertSame(Command::SUCCESS, $tester->getStatusCode());
        self::assertStringContainsString('nothing to invalidate', $tester->getDisplay());
    }

    private function runCommand(): CommandTester
    {
        $application = new Application(self::$kernel);
        $tester      = new CommandTester($application->find('app:password-reset:invalidate-pending'));

        $tester->execute([], ['interactive' => false]);

        return $tester;
    }

    private function reload(PasswordResetToken $token): PasswordResetToken
    {
        return $this->em->getRepository(PasswordResetToken::class)->find($token->getId());
    }

    private function createUser(): User
    {
        $user = (new User())
            ->setEmail('lea@example.test')
            ->setFirstName('Léa')
            ->setPassword('$2y$13$notarealhashjustaplaceholder');

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    private function createToken(User $user, PasswordResetTokenStatus $status): PasswordResetToken
    {
        $token = (new PasswordResetToken())
            ->setToken(hash('sha256', uniqid('', true)))
            ->setStatus($status)
            ->setExpiresAt(new \DateTimeImmutable('+1 hour'))
            ->setUser($user);

        $this->em->persist($token);
        $this->em->flush();

        return $token;
    }
}
