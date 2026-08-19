<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Confession\Confession;
use App\Repository\Confession\ConfessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed:couple-sensitive-preferences', description: 'Idempotently seeds couple sensitive-preference reference data')]
final class SeedCoupleSensitivePreferencesCommand extends Command
{
    public function __construct(
        private readonly ConfessionRepository $confessionRepository,
        private readonly EntityManagerInterface $entityManager,
    ) { parent::__construct(); }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        if ($this->confessionRepository->findOneBy(['slug' => 'mixte']) === null) {
            $this->entityManager->persist((new Confession())->setName('Mixte')->setSlug('mixte'));
            $this->entityManager->flush();
            $io->success('Reference confession "Mixte" created.');
        } else {
            $io->success('Reference confession "Mixte" already exists.');
        }

        return Command::SUCCESS;
    }
}
