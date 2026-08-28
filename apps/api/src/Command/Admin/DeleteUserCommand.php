<?php

declare(strict_types=1);

namespace App\Command\Admin;

use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Admin\UserDeleteService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:user:delete',
    description: 'Delete a user and all associated data',
)]
class DeleteUserCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly VendorRepository $vendorRepository,
        private readonly UserDeleteService $userDeleteService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email of the user to delete')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Actually perform the deletion');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getArgument('email');

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            $io->error(sprintf('No user found with email "%s".', $email));
            return Command::FAILURE;
        }

        $vendor = $this->vendorRepository->findOneByUser($user);

        $report = $this->userDeleteService->getDryRunReport($user, $vendor);

        $io->section(sprintf('User: %s (id: %s)', $email, $user->getId()->toRfc4122()));
        if ($vendor !== null) {
            $io->text(sprintf('Vendor: %s (id: %s)', $vendor->getBrandName(), $vendor->getId()->toRfc4122()));
        } else {
            $io->text('No vendor profile associated.');
        }

        $io->table(['Table', 'Rows to delete'], array_map(
            static fn(array $row) => [$row['table'], $row['rows']],
            $report,
        ));

        if (!$input->getOption('force')) {
            $io->note('Dry-run mode. Rerun with --force to actually delete.');
            return Command::SUCCESS;
        }

        if ($input->isInteractive()) {
            $helper = $this->getHelper('question');
            $confirmed = $helper->ask(
                $input,
                $output,
                new ConfirmationQuestion(
                    sprintf('Confirmer suppression de %s ? [y/N] ', $email),
                    false,
                ),
            );

            if (!$confirmed) {
                $io->warning('Deletion cancelled.');
                return Command::SUCCESS;
            }
        } else {
            $io->note('Non-interactive mode: proceeding with --force.');
        }

        $this->userDeleteService->delete($user, $vendor);
        $io->success(sprintf('User "%s" and all associated data have been deleted.', $email));

        return Command::SUCCESS;
    }
}
