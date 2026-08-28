<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Vendor\VendorWeddreamLaunchResult;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorEmailLog;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\Vendor\VendorEmailLogStatus;
use App\Enum\Vendor\VendorEmailType;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorWeddreamLaunchOutcome;
use App\Repository\User\InviteTokenRepository;
use App\Repository\Vendor\VendorEmailLogRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final readonly class VendorWeddreamLaunchEmailService
{
    private const CONSENT_FORM_URL = 'https://tally.so/r/xX5okd';

    public function __construct(
        private VendorEmailLogRepository $vendorEmailLogRepository,
        private InviteTokenRepository $inviteTokenRepository,
        private EntityManagerInterface $em,
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    /**
     * @param  Vendor[] $vendors
     * @return VendorWeddreamLaunchResult[]
     */
    public function send(array $vendors, bool $dryRun = false, bool $force = false): array
    {
        $results = [];
        foreach ($vendors as $vendor) {
            $results[] = $this->sendToVendor($vendor, $dryRun, $force);
        }

        return $results;
    }

    private function sendToVendor(Vendor $vendor, bool $dryRun, bool $force): VendorWeddreamLaunchResult
    {
        if (!$force && $this->vendorEmailLogRepository->hasBeenSuccessfullySent($vendor, VendorEmailType::WeddreamLaunch)) {
            return new VendorWeddreamLaunchResult($vendor, VendorWeddreamLaunchOutcome::Skipped);
        }

        try {
            $cta = $this->resolveCta($vendor, $dryRun);

            if ($dryRun) {
                return new VendorWeddreamLaunchResult(
                    $vendor,
                    VendorWeddreamLaunchOutcome::DryRun,
                    null,
                    $cta['label'],
                    $cta['url'],
                );
            }

            $this->sendEmail($vendor, $cta['label'], $cta['url']);
            $this->recordAttempt($vendor, VendorEmailLogStatus::Success, null);

            return new VendorWeddreamLaunchResult(
                $vendor,
                VendorWeddreamLaunchOutcome::Sent,
                null,
                $cta['label'],
                $cta['url'],
            );
        } catch (\Throwable $e) {
            $this->logger->error('Vendor WedDream launch email failed to send.', [
                'vendorId'  => $vendor->getId()?->toRfc4122(),
                'exception' => $e,
            ]);

            if (!$dryRun) {
                // Le garde-fou du ticket : un échec sur un prestataire ne doit jamais interrompre
                // les suivants. Si l'exception vient du flush lui-même, l'EntityManager est fermé
                // et cette écriture échouerait à son tour — on l'isole donc de la boucle.
                try {
                    $this->recordAttempt($vendor, VendorEmailLogStatus::Failed, $e->getMessage());
                } catch (\Throwable $recordFailure) {
                    $this->logger->error('Vendor WedDream launch failure could not be recorded.', [
                        'vendorId'  => $vendor->getId()?->toRfc4122(),
                        'exception' => $recordFailure,
                    ]);
                }
            }

            return new VendorWeddreamLaunchResult($vendor, VendorWeddreamLaunchOutcome::Failed, $e->getMessage());
        }
    }

    /** @return array{label: string, url: string} */
    private function resolveCta(Vendor $vendor, bool $dryRun): array
    {
        $status = $vendor->getStatus();

        return match ($status) {
            VendorStatus::Active, VendorStatus::UnderReview => [
                'label' => 'Accéder à mon espace',
                'url'   => rtrim($this->frontendUrl, '/') . '/dashboard',
            ],
            VendorStatus::Pending => [
                'label' => 'Rejoindre Wedly',
                'url'   => $this->resolveInviteUrl($vendor, $dryRun),
            ],
            default => throw new \DomainException(
                'Statut prestataire inattendu pour un envoi WedDream : ' . $status->value,
                500,
            ),
        };
    }

    private function resolveInviteUrl(Vendor $vendor, bool $dryRun): string
    {
        $now = new \DateTimeImmutable();
        $inviteToken = $this->inviteTokenRepository->findActiveVendorInvitation($vendor, $now);

        if ($inviteToken === null) {
            if ($dryRun) {
                return rtrim($this->frontendUrl, '/') . '/onboarding/(token généré au véritable envoi)';
            }

            $inviteToken = (new InviteToken())
                ->setToken(bin2hex(random_bytes(64)))
                ->setPersona(InviteTokenPersona::Vendor)
                ->setStatus(InviteTokenStatus::Pending)
                ->setUser($vendor->getUser())
                ->setVendor($vendor)
                ->setExpiresAt($now->modify('+30 days'));

            $this->em->persist($inviteToken);
            $this->em->flush();
        }

        return rtrim($this->frontendUrl, '/') . '/onboarding/' . $inviteToken->getToken();
    }

    private function sendEmail(Vendor $vendor, string $ctaLabel, string $ctaUrl): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address('contact@wedly-apps.com', 'Wedly'))
            ->to($vendor->getUser()->getEmail())
            ->subject('WedDream est prêt : on le teste au Salon du Mariage')
            ->htmlTemplate('emails/vendor/vendor_weddream_launch.html.twig')
            ->context([
                'firstName'       => $vendor->getUser()->getFirstName(),
                'brandName'       => $vendor->getBrandName(),
                'ctaLabel'        => $ctaLabel,
                'ctaUrl'          => $ctaUrl,
                'consentFormUrl'  => $this->resolveConsentFormUrl($vendor),
                'unsubscribeUrl'  => $this->resolveUnsubscribeUrl($vendor),
            ]);

        $this->mailer->send($email);
    }

    /**
     * Le formulaire Tally porte deux champs cachés (prestataire_id, email) alimentés
     * par query params : le prestataire n'a pas à se ré-identifier en arrivant dessus.
     */
    private function resolveConsentFormUrl(Vendor $vendor): string
    {
        return self::CONSENT_FORM_URL . '?' . http_build_query([
            'prestataire_id' => $vendor->getId()->toRfc4122(),
            'email'          => $vendor->getUser()->getEmail(),
        ]);
    }

    /**
     * L'URL publique reste vendor-scoped pour rester lisible côté prestataire,
     * même si l'opt-out est stocké sur son User.
     */
    private function resolveUnsubscribeUrl(Vendor $vendor): string
    {
        return rtrim($this->frontendUrl, '/') . '/unsubscribe/' . $vendor->getId()->toRfc4122();
    }

    private function recordAttempt(Vendor $vendor, VendorEmailLogStatus $status, ?string $errorMessage): void
    {
        $vendorEmailLog = (new VendorEmailLog())
            ->setVendor($vendor)
            ->setType(VendorEmailType::WeddreamLaunch)
            ->setStatus($status)
            ->setErrorMessage($errorMessage);

        $this->em->persist($vendorEmailLog);
        $this->em->flush();
    }
}
