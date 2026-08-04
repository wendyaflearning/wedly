<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use App\Integration\Slack\SlackWebhookClient;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final readonly class VendorFeedbackService
{
    private const FEEDBACK_RECIPIENT = 'contact@wedly-apps.com';

    public function __construct(
        private MailerInterface $mailer,
        private SlackWebhookClient $slackClient,
        private LoggerInterface $logger,
        private string $frontendUrl,
    ) {}

    public function send(Vendor $vendor, string $message, ?\DateTimeImmutable $sentAt = null): void
    {
        $sentAt = $sentAt ?? new \DateTimeImmutable();
        $message = trim($message);

        $email = (new TemplatedEmail())
            ->from(new Address(self::FEEDBACK_RECIPIENT, 'Wedly'))
            ->to(self::FEEDBACK_RECIPIENT)
            ->subject(sprintf('Nouveau feedback prestataire - %s', $vendor->getBrandName()))
            ->htmlTemplate('emails/vendor/vendor_feedback.html.twig')
            ->context([
                'vendorName' => $this->buildVendorName($vendor),
                'vendorBrandName' => $vendor->getBrandName(),
                'vendorEmail' => $vendor->getUser()->getEmail(),
                'message' => $message,
                'sentAt' => $sentAt,
                'adminUrl' => $this->buildAdminUrl($vendor),
            ]);

        $this->mailer->send($email);

        $this->notifySlack($vendor, $message, $sentAt);
    }

    private function notifySlack(Vendor $vendor, string $message, \DateTimeImmutable $sentAt): void
    {
        try {
            $this->slackClient->notify($this->buildSlackMessage($vendor, $message, $sentAt));
        } catch (\Throwable $exception) {
            $this->logger->error('Vendor feedback Slack notification failed.', [
                'vendor_id' => (string) $vendor->getId(),
                'vendor_email' => $vendor->getUser()->getEmail(),
                'exception' => $exception,
            ]);
        }
    }

    private function buildVendorName(Vendor $vendor): string
    {
        $fullName = trim(sprintf(
            '%s %s',
            $vendor->getUser()->getFirstName(),
            $vendor->getUser()->getLastName() ?? '',
        ));

        return $fullName !== '' ? $fullName : $vendor->getBrandName();
    }

    private function buildAdminUrl(Vendor $vendor): string
    {
        return rtrim($this->frontendUrl, '/') . '/admin/prestataires/' . $vendor->getId();
    }

    private function buildSlackMessage(Vendor $vendor, string $message, \DateTimeImmutable $sentAt): string
    {
        return implode("\n", [
            ':mailbox_with_mail: Nouveau feedback prestataire',
            sprintf('Prestataire: %s (%s)', $this->buildVendorName($vendor), $vendor->getBrandName()),
            sprintf('Email: %s', $vendor->getUser()->getEmail()),
            sprintf('Date: %s', $sentAt->format('d/m/Y H:i')),
            sprintf('Admin: %s', $this->buildAdminUrl($vendor)),
            'Message:',
            $message,
        ]);
    }
}
