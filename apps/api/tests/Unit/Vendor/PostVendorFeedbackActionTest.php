<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Controller\Vendor\Feedback\PostVendorFeedbackAction;
use App\DTO\Vendor\VendorFeedbackRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Integration\Slack\SlackWebhookClient;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorFeedbackService;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Uid\UuidV7;

final class PostVendorFeedbackActionTest extends TestCase
{
    public function test_it_returns_404_when_vendor_does_not_exist(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('find')
            ->with('missing-vendor')
            ->willReturn(null);

        $security = $this->createStub(Security::class);
        $response = $this->makeAction($security, $vendorRepository, $this->makeFeedbackService())
            ->__invoke('missing-vendor', new VendorFeedbackRequestDto('Bonjour'));

        self::assertSame(404, $response->getStatusCode());
        self::assertSame(['error' => 'Vendor not found.'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    public function test_it_returns_403_when_authenticated_user_does_not_own_vendor(): void
    {
        $authenticatedUser = (new User())->setFirstName('Owner')->setEmail('owner@example.fr')->setPassword('password');
        $otherUser = (new User())->setFirstName('Other')->setEmail('other@example.fr')->setPassword('password');
        $vendor = (new Vendor())
            ->setUser($otherUser)
            ->setBrandName('Studio Test');

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($authenticatedUser);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('find')
            ->with('vendor-1')
            ->willReturn($vendor);

        $response = $this->makeAction($security, $vendorRepository, $this->makeFeedbackService())
            ->__invoke('vendor-1', new VendorFeedbackRequestDto('Bonjour'));

        self::assertSame(403, $response->getStatusCode());
        self::assertSame(['error' => 'Access denied.'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    public function test_it_sends_feedback_for_vendor_owner(): void
    {
        $authenticatedUser = (new User())->setFirstName('Owner')->setEmail('owner@example.fr')->setPassword('password');
        $vendor = (new Vendor())
            ->setUser($authenticatedUser)
            ->setBrandName('Studio Test');
        $this->setPrivateProperty($vendor, 'id', new UuidV7());

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($authenticatedUser);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('find')
            ->with('vendor-1')
            ->willReturn($vendor);

        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects($this->once())->method('send');

        $response = $this->makeAction($security, $vendorRepository, $this->makeFeedbackService($mailer))
            ->__invoke('vendor-1', new VendorFeedbackRequestDto('Bonjour Wedly'));

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['status' => 'sent'], json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR));
    }

    private function makeAction(
        Security $security,
        VendorRepository $vendorRepository,
        VendorFeedbackService $feedbackService,
    ): PostVendorFeedbackAction {
        return new PostVendorFeedbackAction($security, $vendorRepository, $feedbackService);
    }

    private function makeFeedbackService(?MailerInterface $mailer = null): VendorFeedbackService
    {
        return new VendorFeedbackService(
            $mailer ?? $this->createStub(MailerInterface::class),
            $this->createStub(SlackWebhookClient::class),
            $this->createStub(LoggerInterface::class),
            'https://app.wedly.test',
        );
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
