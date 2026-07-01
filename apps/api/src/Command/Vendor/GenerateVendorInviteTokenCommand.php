<?php

declare(strict_types=1);

namespace App\Command\Vendor;

use App\Entity\User\InviteToken;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\User\Role;
use App\Repository\User\UserRepository;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'app:vendor:generate-invite-token',
    description: 'Generate (or retrieve) an onboarding invite token for a vendor — for demo use only',
)]
class GenerateVendorInviteTokenCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly VendorRepository $vendorRepository,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'Email du prestataire');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getArgument('email');

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            $io->error(sprintf('Aucun utilisateur trouvé avec l\'email "%s".', $email));
            return Command::FAILURE;
        }

        if (!in_array(Role::Vendor->value, $user->getRoles(), true)) {
            $io->error(sprintf('L\'utilisateur "%s" n\'est pas un prestataire.', $email));
            return Command::FAILURE;
        }

        $vendor = $this->vendorRepository->findOneByUser($user);
        if ($vendor === null) {
            $io->error(sprintf('Aucun profil prestataire trouvé pour "%s".', $email));
            return Command::FAILURE;
        }

        $now = new \DateTimeImmutable();

        $inviteToken = $this->em->getRepository(InviteToken::class)->findOneBy([
            'vendor' => $vendor,
            'status' => InviteTokenStatus::Pending,
        ]);

        if ($inviteToken !== null && $inviteToken->getExpiresAt() < $now) {
            $inviteToken->setStatus(InviteTokenStatus::Expired);
            $inviteToken = null;
        }

        $isNew = false;
        if ($inviteToken === null) {
            $inviteToken = (new InviteToken())
                ->setToken(bin2hex(random_bytes(64)))
                ->setPersona(InviteTokenPersona::Vendor)
                ->setStatus(InviteTokenStatus::Pending)
                ->setUser($user)
                ->setVendor($vendor)
                ->setExpiresAt($now->modify('+30 days'));

            $this->em->persist($inviteToken);
            $this->em->flush();
            $isNew = true;
        }

        $name = trim($user->getFirstName() . ' ' . ($user->getLastName() ?? ''));
        $url = $this->frontendUrl . '/onboarding/' . $inviteToken->getToken();

        if ($isNew) {
            $io->success(sprintf('Nouveau token généré pour %s (%s)', $name, $email));
        } else {
            $io->success(sprintf('Token actif existant pour %s (%s)', $name, $email));
        }

        $io->writeln($url);

        return Command::SUCCESS;
    }
}
