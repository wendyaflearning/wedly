<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Confession\Confession;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed:couple-sensitive-preferences', description: 'Idempotently seeds couple sensitive-preference reference data')]
final class SeedCoupleSensitivePreferencesCommand extends Command
{
    private const MISSING_CONFESSION_NAME = 'Mixte';
    private const MISSING_CONFESSION_SLUG = 'mixte';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) { parent::__construct(); }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $repository = $this->entityManager->getRepository(Confession::class);

        if ($repository->findOneBy(['slug' => self::MISSING_CONFESSION_SLUG]) !== null) {
            $io->success(sprintf('Reference confession "%s" already exists.', self::MISSING_CONFESSION_NAME));

            return Command::SUCCESS;
        }

        $this->entityManager->persist(
            (new Confession())
                ->setName(self::MISSING_CONFESSION_NAME)
                ->setSlug(self::MISSING_CONFESSION_SLUG)
        );
        $this->entityManager->flush();

        $io->success(sprintf('Reference confession "%s" created.', self::MISSING_CONFESSION_NAME));

        return Command::SUCCESS;
    }
}
