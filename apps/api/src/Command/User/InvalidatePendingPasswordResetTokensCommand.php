<?php

declare(strict_types=1);

namespace App\Command\User;

use App\Entity\User\PasswordResetToken;
use App\Enum\User\PasswordResetTokenStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Opération de données one-shot liée à WED-167 (F1).
 *
 * Tant que le destinataire du mail de réinitialisation était détourné vers la
 * boîte interne, chaque demande de reset y a déposé un lien valide une heure,
 * utilisable sur un compte quelconque. Corriger le destinataire ferme la porte
 * pour l'avenir mais laisse vivre les liens déjà partis : cette commande les
 * périme d'un coup, en marquant `Used` tout token encore `Pending`.
 *
 * Ce n'est volontairement pas une migration : le schéma ne bouge pas, seules
 * des lignes changent d'état. Une migration rejouerait l'opération sur chaque
 * environnement, alors qu'il s'agit d'un geste d'incident ponctuel.
 *
 * Conséquence assumée : les utilisateurs ayant une demande légitime en cours
 * devront la refaire. C'est le prix à payer pour fermer la fenêtre, et le
 * parcours de reset est de nouveau fonctionnel.
 */
#[AsCommand(
    name: 'app:password-reset:invalidate-pending',
    description: 'Invalidate every pending password reset token (WED-167 incident cleanup)',
)]
final class InvalidatePendingPasswordResetTokensCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // UPDATE en masse plutôt qu'un parcours entité par entité : l'opération
        // n'a aucune logique métier par ligne, et le volume est inconnu à
        // l'avance. En contrepartie les lifecycle callbacks ne se déclenchent
        // pas, d'où le `updatedAt` positionné explicitement — sans lui on
        // perdrait la date à laquelle la purge a eu lieu.
        $invalidated = (int) $this->em->createQuery(
            \sprintf(
                'UPDATE %s t SET t.status = :used, t.updatedAt = :now WHERE t.status = :pending',
                PasswordResetToken::class,
            ),
        )
            ->setParameter('used', PasswordResetTokenStatus::Used)
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('pending', PasswordResetTokenStatus::Pending)
            ->execute();

        if ($invalidated === 0) {
            $io->success('No pending password reset token found: nothing to invalidate.');

            return Command::SUCCESS;
        }

        $io->success(\sprintf(
            '%d pending password reset token(s) invalidated. The matching reset links no longer work.',
            $invalidated,
        ));

        return Command::SUCCESS;
    }
}
