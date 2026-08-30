<?php

declare(strict_types=1);

namespace App\Tests\Unit\Command;

use App\Command\SeedCoupleSensitivePreferencesCommand;
use App\Entity\Confession\Confession;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class SeedCoupleSensitivePreferencesCommandTest extends TestCase
{
    public function test_it_creates_the_missing_mixte_confession(): void
    {
        $persisted = null;

        $entityManager = $this->makeEntityManager(existingConfession: null);
        $entityManager->expects($this->once())->method('persist')
            ->willReturnCallback(function (object $entity) use (&$persisted): void { $persisted = $entity; });
        $entityManager->expects($this->once())->method('flush');

        $tester = new CommandTester(new SeedCoupleSensitivePreferencesCommand($entityManager));

        $this->assertSame(0, $tester->execute([]));
        $this->assertInstanceOf(Confession::class, $persisted);
        $this->assertSame('Mixte', $persisted->getName());
        $this->assertSame('mixte', $persisted->getSlug());
        $this->assertStringContainsString('created', $tester->getDisplay());
    }

    public function test_running_it_again_writes_nothing(): void
    {
        $entityManager = $this->makeEntityManager(existingConfession: new Confession());
        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $tester = new CommandTester(new SeedCoupleSensitivePreferencesCommand($entityManager));

        $this->assertSame(0, $tester->execute([]));
        $this->assertStringContainsString('already exists', $tester->getDisplay());
    }

    /**
     * The seed has to stay idempotent: the reference data is already installed by
     * a legacy raw-SQL migration, so this command may run on an up-to-date table.
     */
    private function makeEntityManager(?Confession $existingConfession): EntityManagerInterface&\PHPUnit\Framework\MockObject\MockObject
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('findOneBy')
            ->with(['slug' => 'mixte'])
            ->willReturn($existingConfession);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('getRepository')
            ->with(Confession::class)
            ->willReturn($repository);

        return $entityManager;
    }
}
