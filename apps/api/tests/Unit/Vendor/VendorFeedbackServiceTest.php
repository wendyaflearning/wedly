<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Service\Vendor\VendorFeedbackService;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Uid\UuidV7;

final class VendorFeedbackServiceTest extends TestCase
{
    public function test_it_sends_feedback_email_with_expected_context(): void
    {
        $vendor = $this->makeVendor();

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function (TemplatedEmail $email): bool {
                self::assertSame('contact@wedly-apps.com', $email->getTo()[0]->getAddress());
                self::assertSame('Nouveau feedback prestataire - Studio Camille', $email->getSubject());
                self::assertSame('emails/vendor/vendor_feedback.html.twig', $email->getHtmlTemplate());
                self::assertSame('Camille Martin', $email->getContext()['vendorName']);
                self::assertSame('camille@example.fr', $email->getContext()['vendorEmail']);
                self::assertSame('Bonjour Wedly', $email->getContext()['message']);
                self::assertStringContainsString('/admin/prestataires/', $email->getContext()['adminUrl']);

                return true;
            }));

        $service = new VendorFeedbackService(
            $mailer,
            new MockHttpClient(),
            'https://app.wedly.test',
            '',
        );

        $service->send($vendor, '  Bonjour Wedly  ', new \DateTimeImmutable('2026-07-07 10:30:00'));
    }

    public function test_it_posts_to_slack_when_webhook_is_configured(): void
    {
        $vendor = $this->makeVendor();
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $requests = [];
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$requests) {
            $requests[] = [$method, $url, $options];

            return new MockResponse('ok', ['http_code' => 200]);
        });

        $service = new VendorFeedbackService(
            $mailer,
            $httpClient,
            'https://app.wedly.test',
            'https://hooks.slack.test/services/123',
        );

        $service->send($vendor, 'Message important', new \DateTimeImmutable('2026-07-07 10:30:00'));

        self::assertCount(1, $requests);
        self::assertSame('POST', $requests[0][0]);
        self::assertSame('https://hooks.slack.test/services/123', $requests[0][1]);
        self::assertStringContainsString('Message important', (string) ($requests[0][2]['body'] ?? ''));
    }

    private function makeVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setLastName('Martin')
            ->setEmail('camille@example.fr')
            ->setPassword('password');
        $this->setPrivateProperty($user, 'id', new UuidV7());

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille');
        $this->setPrivateProperty($vendor, 'id', new UuidV7());

        return $vendor;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
