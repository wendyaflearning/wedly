<?php

declare(strict_types=1);

namespace App\Service\Vendor;

use App\Entity\Vendor\Vendor;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class VendorFeedbackService
{
    private const FEEDBACK_RECIPIENT = 'contact@wedly-apps.com';

    public function __construct(
        private MailerInterface $mailer,
        private HttpClientInterface $httpClient,
        private string $frontendUrl,
        private string $slackWebhookUrl,
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

        if ($this->slackWebhookUrl !== '') {
            $response = $this->httpClient->request('POST', $this->slackWebhookUrl, [
                'json' => [
                    'text' => $this->buildSlackMessage($vendor, $message, $sentAt),
                ],
            ]);

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Slack notification failed.');
            }
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
