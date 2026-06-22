<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Event\VendorRejectedEvent;
use App\Event\VendorValidatedEvent;
use App\Service\Vendor\AdminVendorReviewService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class AdminVendorReviewServiceTest extends TestCase
{
    public function test_validate_activates_vendor_and_user_then_dispatches_confirmation_email(): void
    {
        $vendor = $this->makeVendor();
        $vendor->setStatus(VendorStatus::UnderReview);
        $vendor->setIsPublished(false);
        $vendor->setRejectionReasons([VendorRejectionReason::PortfolioQuality->value]);
        $vendor->setRejectionNote('À reprendre');

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $dispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (object $event): bool {
                self::assertInstanceOf(VendorValidatedEvent::class, $event);
                self::assertSame('Camille', $event->firstName);
                self::assertSame('camille@example.fr', $event->email);
                self::assertSame('https://wedly.test/dashboard', $event->dashboardUrl);

                return true;
            }))
            ->willReturnArgument(0);

        $this->makeService($dispatcher)->validate($vendor);

        self::assertSame(VendorStatus::Active, $vendor->getStatus());
        self::assertSame(UserStatus::Active, $vendor->getUser()->getStatus());
        self::assertTrue($vendor->isPublished());
        self::assertNull($vendor->getRejectionReasons());
        self::assertNull($vendor->getRejectionNote());
        self::assertInstanceOf(\DateTimeImmutable::class, $vendor->getReviewedAt());
    }

    public function test_reject_suspends_user_and_dispatches_rejection_email_with_reasons(): void
    {
        $vendor = $this->makeVendor();
        $vendor->setStatus(VendorStatus::UnderReview);
        $vendor->setIsPublished(true);

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $dispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (object $event): bool {
                self::assertInstanceOf(VendorRejectedEvent::class, $event);
                self::assertSame('Camille', $event->firstName);
                self::assertSame('camille@example.fr', $event->email);
                self::assertSame([
                    'Portfolio insuffisant ou de mauvaise qualité',
                    'Autre',
                ], $event->reasons);
                self::assertSame('Images trop sombres.', $event->note);

                return true;
            }))
            ->willReturnArgument(0);

        $this->makeService($dispatcher)->reject($vendor, [
            VendorRejectionReason::PortfolioQuality,
            VendorRejectionReason::Other,
        ], 'Images trop sombres.');

        self::assertSame(VendorStatus::Rejected, $vendor->getStatus());
        self::assertSame(UserStatus::Suspended, $vendor->getUser()->getStatus());
        self::assertFalse($vendor->isPublished());
        self::assertSame([
            VendorRejectionReason::PortfolioQuality->value,
            VendorRejectionReason::Other->value,
        ], $vendor->getRejectionReasons());
        self::assertSame('Images trop sombres.', $vendor->getRejectionNote());
        self::assertInstanceOf(\DateTimeImmutable::class, $vendor->getReviewedAt());
    }

    private function makeService(EventDispatcherInterface $dispatcher): AdminVendorReviewService
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        return new AdminVendorReviewService($em, $dispatcher, 'https://wedly.test');
    }

    private function makeVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.fr')
            ->setPassword('hashed')
            ->setRoles(['ROLE_VENDOR'])
            ->setStatus(UserStatus::UnderReview);

        return (new Vendor())->setUser($user)->setBrandName('Studio Camille');
    }
}
