<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Event\VendorOnboardingSubmittedEvent;
use App\EventListener\VendorOnboardingConfirmationSlackListener;
use App\Integration\Slack\SlackWebhookClient;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

final class VendorOnboardingConfirmationSlackListenerTest extends TestCase
{
    private function makeEvent(bool $isFirstSubmission = true): VendorOnboardingSubmittedEvent
    {
        return new VendorOnboardingSubmittedEvent(
            vendorId: '01960000-0000-7000-8000-000000000000',
            firstName: 'Sophie',
            lastName: 'Dupont',
            email: 'sophie@example.fr',
            brand: 'Sophie Fleurs',
            category: 'freelance',
            regions: ['Île-de-France'],
            submittedForReviewAt: new \DateTimeImmutable('2026-07-07 10:30:00'),
            isFirstSubmission: $isFirstSubmission,
        );
    }

    public function test_it_notifies_slack_with_vendor_name_category_and_admin_link_on_kernel_terminate(): void
    {
        $slackClient = $this->createMock(SlackWebhookClient::class);
        $slackClient->expects($this->once())
            ->method('notify')
            ->with($this->callback(function (string $message): bool {
                self::assertStringContainsString('Sophie Dupont', $message);
                self::assertStringContainsString('freelance', $message);
                self::assertStringContainsString(
                    'https://app.wedly.test/admin/prestataires/01960000-0000-7000-8000-000000000000',
                    $message
                );

                return true;
            }));

        $listener = new VendorOnboardingConfirmationSlackListener(
            $slackClient,
            'https://app.wedly.test',
            $this->createStub(LoggerInterface::class),
        );

        $listener->onVendorOnboardingSubmitted($this->makeEvent());
        $listener->onKernelTerminate();
    }

    public function test_kernel_terminate_without_prior_submission_does_not_call_slack(): void
    {
        $slackClient = $this->createMock(SlackWebhookClient::class);
        $slackClient->expects($this->never())->method('notify');

        $listener = new VendorOnboardingConfirmationSlackListener(
            $slackClient,
            'https://app.wedly.test',
            $this->createStub(LoggerInterface::class),
        );

        $listener->onKernelTerminate();
    }

    public function test_it_notifies_slack_even_when_resubmission_after_rejection(): void
    {
        $slackClient = $this->createMock(SlackWebhookClient::class);
        $slackClient->expects($this->once())->method('notify');

        $listener = new VendorOnboardingConfirmationSlackListener(
            $slackClient,
            'https://app.wedly.test',
            $this->createStub(LoggerInterface::class),
        );

        $listener->onVendorOnboardingSubmitted($this->makeEvent(isFirstSubmission: false));
        $listener->onKernelTerminate();
    }

    public function test_it_logs_and_swallows_exception_when_slack_notify_fails(): void
    {
        $slackClient = $this->createMock(SlackWebhookClient::class);
        $slackClient->expects($this->once())
            ->method('notify')
            ->willThrowException(new \RuntimeException('Slack webhook returned status 500.'));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())
            ->method('error')
            ->with(
                'Vendor onboarding confirmation Slack notification failed.',
                $this->callback(function (array $context): bool {
                    self::assertSame('01960000-0000-7000-8000-000000000000', $context['vendorId']);
                    self::assertArrayHasKey('exception', $context);

                    return true;
                })
            );

        $listener = new VendorOnboardingConfirmationSlackListener(
            $slackClient,
            'https://app.wedly.test',
            $logger,
        );

        $listener->onVendorOnboardingSubmitted($this->makeEvent());
        $listener->onKernelTerminate();

        self::assertTrue(true);
    }
}
