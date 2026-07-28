<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Event\VendorOnboardingSubmittedEvent;
use App\Integration\Slack\SlackWebhookClient;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: VendorOnboardingSubmittedEvent::class, method: 'onVendorOnboardingSubmitted')]
#[AsEventListener(event: KernelEvents::TERMINATE, method: 'onKernelTerminate')]
final class VendorOnboardingConfirmationSlackListener
{
    private ?array $pendingNotification = null;

    public function __construct(
        private readonly SlackWebhookClient $slackClient,
        #[Autowire('%env(FRONTEND_URL)%')]
        private readonly string $frontendUrl,
        private readonly LoggerInterface $logger,
    ) {}

    public function onVendorOnboardingSubmitted(VendorOnboardingSubmittedEvent $event): void
    {
        $this->pendingNotification = [
            'vendorId'             => $event->vendorId,
            'firstName'            => $event->firstName,
            'lastName'             => $event->lastName,
            'brand'                => $event->brand,
            'category'             => $event->category,
            'submittedForReviewAt' => $event->submittedForReviewAt,
        ];
    }

    public function onKernelTerminate(): void
    {
        if ($this->pendingNotification === null) {
            return;
        }

        $data = $this->pendingNotification;
        $this->pendingNotification = null;

        try {
            $this->slackClient->notify($this->buildMessage($data));
        } catch (\Throwable $e) {
            $this->logger->error('Vendor onboarding confirmation Slack notification failed.', [
                'vendorId'  => $data['vendorId'],
                'exception' => $e,
            ]);
        }
    }

    private function buildMessage(array $data): string
    {
        $fullName = trim(sprintf('%s %s', $data['firstName'], $data['lastName']));
        $adminUrl = rtrim($this->frontendUrl, '/') . '/admin/prestataires/' . $data['vendorId'];
        $submittedAt = $data['submittedForReviewAt'] instanceof \DateTimeImmutable
            ? $data['submittedForReviewAt']->format('d/m/Y H:i')
            : '—';

        return implode("\n", [
            ':new: Nouveau prestataire inscrit',
            sprintf('Nom : %s', $fullName),
            sprintf('Catégorie : %s', $data['category']),
            sprintf('Soumis le : %s', $submittedAt),
            sprintf('Voir la fiche : %s', $adminUrl),
        ]);
    }
}
