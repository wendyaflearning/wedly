<?php

// TEMP - à supprimer après recette

declare(strict_types=1);

namespace App\Command;

use App\Event\VendorOnboardingSubmittedEvent;
use App\Event\VendorValidatedEvent;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[AsCommand(name: 'app:test-mail')]
class TestMailCommand extends Command
{
    public function __construct(private EventDispatcherInterface $eventDispatcher)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->eventDispatcher->dispatch(new VendorOnboardingSubmittedEvent(
            vendorId: '01960000-0000-7000-8000-000000000000',
            firstName: 'Jennifer',
            lastName: 'Test',
            email: 'wendyaf.learning@gmail.com',
            brand: 'Jennifer Fleurs',
            category: 'freelance',
            regions: ['Île-de-France'],
            submittedForReviewAt: new \DateTimeImmutable(),
            isFirstSubmission: true,
        ));

        $output->writeln('Mail envoyé ✅');

        return Command::SUCCESS;
    }
}
