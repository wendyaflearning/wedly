<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\DTO\Admin\Vendor\AdminVendorInvitationSendResponseDto;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Repository\User\InviteTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final readonly class AdminVendorInvitationService
{
    public function __construct(
        private InviteTokenRepository $inviteTokenRepository,
        private EntityManagerInterface $em,
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')]
        private string $frontendUrl,
    ) {}

    /** @return InviteToken[] */
    public function list(string $scope, ?\DateTimeImmutable $now = null): array
    {
        if (!in_array($scope, ['active', 'expired'], true)) {
            throw new \DomainException('Invalid invitation scope.', 422);
        }

        $now ??= new \DateTimeImmutable();

        return $scope === 'expired'
            ? $this->inviteTokenRepository->findExpiredVendorInvitations($now)
            : $this->inviteTokenRepository->findActiveVendorInvitations($now);
    }

    public function send(Vendor $vendor, User $adminUser): AdminVendorInvitationSendResponseDto
    {
        $this->assertEditable($vendor);
        $this->assertVendorReadyForInvitation($vendor);

        $now = new \DateTimeImmutable();
        $inviteToken = $this->inviteTokenRepository->findActiveVendorInvitation($vendor, $now);
        if ($inviteToken === null) {
            $inviteToken = (new InviteToken())
                ->setToken(bin2hex(random_bytes(64)))
                ->setCreatedBy($adminUser)
                ->setPersona(InviteTokenPersona::Vendor)
                ->setStatus(InviteTokenStatus::Pending)
                ->setUser($vendor->getUser())
                ->setVendor($vendor)
                ->setExpiresAt($now->modify('+30 days'));

            $this->em->persist($inviteToken);
            $this->em->flush();
        }

        $emailSent = $this->sendInvitationEmail($vendor, $inviteToken);

        return new AdminVendorInvitationSendResponseDto($vendor, $inviteToken, $this->frontendUrl, $emailSent);
    }

    private function assertEditable(Vendor $vendor): void
    {
        if ($this->inviteTokenRepository->hasUsedVendorInvitation($vendor)) {
            throw new \DomainException('Invitation already used; vendor draft can no longer be edited.', 409);
        }
    }

    private function assertVendorReadyForInvitation(Vendor $vendor): void
    {
        if ($vendor->getUser()->getFirstName() === '' || $vendor->getUser()->getEmail() === '' || $vendor->getBrandName() === '') {
            throw new \DomainException('Missing required identity fields.', 422);
        }
        if ($vendor->getServices()->isEmpty() || $vendor->getRegions()->isEmpty()) {
            throw new \DomainException('Missing required profession or region fields.', 422);
        }
        if ($vendor->getPriceMinCents() < 0 || $vendor->getPriceMaxCents() < 0 || $vendor->getPriceMinCents() > $vendor->getPriceMaxCents()) {
            throw new \DomainException('Invalid price range.', 422);
        }
    }

    private function sendInvitationEmail(Vendor $vendor, InviteToken $inviteToken): bool
    {
        try {
            $email = (new TemplatedEmail())
                ->from(new Address('contact@wedly-apps.com', 'Wedly'))
                ->to($vendor->getUser()->getEmail())
                ->subject('Complétez votre profil Wedly')
                ->htmlTemplate('emails/vendor/vendor_admin_invitation.html.twig')
                ->context([
                    'firstName'     => $vendor->getUser()->getFirstName(),
                    'brandName'     => $vendor->getBrandName(),
                    'invitationUrl' => rtrim($this->frontendUrl, '/') . '/onboarding/' . $inviteToken->getToken(),
                    'expiresAt'     => $inviteToken->getExpiresAt(),
                ]);

            $this->mailer->send($email);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
