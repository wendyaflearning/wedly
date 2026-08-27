<?php

declare(strict_types=1);

namespace App\Command\Vendor;

use App\DTO\Vendor\VendorWeddreamLaunchResult;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorWeddreamLaunchOutcome;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorWeddreamLaunchEmailService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Point d'entrée opérationnel de la campagne de lancement WedDream.
 *
 * Cette commande n'a aucune logique métier propre : elle valide les options de ciblage,
 * délègue la sélection au repository et l'envoi au service, puis restitue un résumé.
 * Le CTA, l'anti-double-envoi et la traçabilité restent dans VendorWeddreamLaunchEmailService.
 */
#[AsCommand(
    name: 'app:vendor:send-weddream',
    description: 'Send the WedDream launch email to the targeted vendors',
)]
class SendWeddreamLaunchEmailCommand extends Command
{
    /** Même règle que les routes admin vendor (requirements: '[0-9a-fA-F-]{36}'). */
    private const VENDOR_ID_PATTERN = '/^[0-9a-fA-F-]{36}$/';

    public function __construct(
        private readonly VendorRepository $vendorRepository,
        private readonly VendorWeddreamLaunchEmailService $emailService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('vendor', null, InputOption::VALUE_REQUIRED, 'Cibler un seul prestataire par son identifiant')
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Cibler un seul prestataire par son email')
            ->addOption('status', null, InputOption::VALUE_REQUIRED, 'Cibler tous les prestataires d\'un statut : active ou brouillon')
            ->addOption('all', null, InputOption::VALUE_NONE, 'Cibler tous les prestataires éligibles')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Simuler la campagne : aucun email envoyé, aucune écriture en base')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Renvoyer même aux prestataires déjà contactés avec succès');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $vendorId = $this->stringOption($input, 'vendor');
        $email    = $this->stringOption($input, 'email');
        $status   = $this->stringOption($input, 'status');
        $all      = (bool) $input->getOption('all');
        $dryRun   = (bool) $input->getOption('dry-run');
        $force    = (bool) $input->getOption('force');

        // Aucun mode implicite : ni ciblage vide qui enverrait à tout le monde, ni combinaison ambiguë.
        $activeModes = count(array_filter([$vendorId !== null, $email !== null, $status !== null, $all]));
        if ($activeModes !== 1) {
            $io->error('Un seul mode de ciblage doit être actif : --vendor, --email, --status ou --all.');

            return Command::INVALID;
        }

        if ($vendorId !== null && preg_match(self::VENDOR_ID_PATTERN, $vendorId) !== 1) {
            $io->error(sprintf('Identifiant prestataire invalide : "%s". Attendu : un UUID de 36 caractères.', $vendorId));

            return Command::INVALID;
        }

        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $io->error(sprintf('Email invalide : "%s".', $email));

            return Command::INVALID;
        }

        $vendorStatus = null;
        if ($status !== null) {
            // Seul endroit du projet qui traduit la valeur CLI en enum : le repository
            // et le service ne reçoivent jamais qu'un VendorStatus déjà résolu.
            $vendorStatus = match ($status) {
                'active'    => VendorStatus::Active,
                'brouillon' => VendorStatus::Pending,
                default     => null,
            };

            if ($vendorStatus === null) {
                $io->error(sprintf('Valeur invalide pour --status : "%s". Attendu : active ou brouillon.', $status));

                return Command::INVALID;
            }
        }

        try {
            $vendors = $this->vendorRepository->findEligibleForWeddreamLaunch(
                vendorId: $vendorId,
                email: $email,
                status: $vendorStatus,
            );
        } catch (\DomainException $e) {
            // Inatteignable vu la validation d'exclusivité ci-dessus, gardé par sécurité :
            // le repository refuse lui aussi plusieurs modes simultanés.
            $io->error($e->getMessage());

            return Command::FAILURE;
        }

        if ($vendors === []) {
            if ($vendorId !== null || $email !== null) {
                $io->error('Aucun prestataire éligible ne correspond à ce ciblage direct.');

                return Command::FAILURE;
            }

            $io->warning('Aucun prestataire éligible trouvé pour ce ciblage.');

            return Command::SUCCESS;
        }

        if ($dryRun) {
            $io->note('Mode DRY-RUN — aucun email ne sera réellement envoyé, aucune écriture en base.');
        }

        $results = $this->emailService->send($vendors, dryRun: $dryRun, force: $force);

        $this->renderDetails($io, $results);
        $this->renderSummary($io, $results, $dryRun);

        // Un échec de mailer isolé ne fait pas échouer la campagne : il reste visible
        // dans le résumé ci-dessus et dans vendor_email_log.
        return Command::SUCCESS;
    }

    /** @param VendorWeddreamLaunchResult[] $results */
    private function renderDetails(SymfonyStyle $io, array $results): void
    {
        $io->table(
            ['Marque', 'Email', 'Statut', 'Résultat', 'Détail'],
            array_map(
                fn(VendorWeddreamLaunchResult $result): array => [
                    $result->vendor->getBrandName(),
                    $result->vendor->getUser()->getEmail(),
                    $result->vendor->getStatus()->value,
                    $this->outcomeLabel($result->outcome),
                    $this->outcomeDetail($result),
                ],
                $results,
            ),
        );
    }

    /** @param VendorWeddreamLaunchResult[] $results */
    private function renderSummary(SymfonyStyle $io, array $results, bool $dryRun): void
    {
        $failed = $this->countOutcome($results, VendorWeddreamLaunchOutcome::Failed);

        $summary = [
            sprintf('Prestataires éligibles : %d', count($results)),
            $dryRun
                ? sprintf('À envoyer : %d', $this->countOutcome($results, VendorWeddreamLaunchOutcome::DryRun))
                : sprintf('Envoyés : %d', $this->countOutcome($results, VendorWeddreamLaunchOutcome::Sent)),
            sprintf('Skippés : %d', $this->countOutcome($results, VendorWeddreamLaunchOutcome::Skipped)),
            sprintf('En échec : %d', $failed),
        ];

        if ($failed > 0) {
            $io->warning($summary);

            return;
        }

        $io->success($summary);
    }

    /** @param VendorWeddreamLaunchResult[] $results */
    private function countOutcome(array $results, VendorWeddreamLaunchOutcome $outcome): int
    {
        return count(array_filter(
            $results,
            static fn(VendorWeddreamLaunchResult $result): bool => $result->outcome === $outcome,
        ));
    }

    private function outcomeLabel(VendorWeddreamLaunchOutcome $outcome): string
    {
        return match ($outcome) {
            VendorWeddreamLaunchOutcome::Sent    => 'Envoyé',
            VendorWeddreamLaunchOutcome::Skipped => 'Skippé',
            VendorWeddreamLaunchOutcome::Failed  => 'Échec',
            VendorWeddreamLaunchOutcome::DryRun  => 'Dry-run',
        };
    }

    private function outcomeDetail(VendorWeddreamLaunchResult $result): string
    {
        return match ($result->outcome) {
            VendorWeddreamLaunchOutcome::Sent,
            VendorWeddreamLaunchOutcome::DryRun  => $result->ctaLabel ?? '-',
            VendorWeddreamLaunchOutcome::Failed  => $result->errorMessage ?? '-',
            VendorWeddreamLaunchOutcome::Skipped => '-',
        };
    }

    private function stringOption(InputInterface $input, string $name): ?string
    {
        $value = $input->getOption($name);

        return is_string($value) ? $value : null;
    }
}
