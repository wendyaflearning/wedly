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
            VendorRejectionReason::PortfolioQuality->value,
            VendorRejectionReason::Other->value,
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

    public function test_validate_does_not_dispatch_email_when_vendor_is_already_active(): void
    {
        $vendor = $this->makeVendor();
        $vendor->setStatus(VendorStatus::Active);

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $dispatcher->expects($this->never())->method('dispatch');

        $this->makeService($dispatcher)->validate($vendor);

        self::assertSame(VendorStatus::Active, $vendor->getStatus());
        self::assertSame(UserStatus::Active, $vendor->getUser()->getStatus());
        self::assertTrue($vendor->isPublished());
    }

    public function test_reject_does_not_dispatch_email_when_vendor_is_already_rejected(): void
    {
        $vendor = $this->makeVendor();
        $vendor->setStatus(VendorStatus::Rejected);
        $vendor->setIsPublished(true);

        $dispatcher = $this->createMock(EventDispatcherInterface::class);
        $dispatcher->expects($this->never())->method('dispatch');

        $this->makeService($dispatcher)->reject($vendor, [
            VendorRejectionReason::Other->value,
        ], 'Profil déjà refusé.');

        self::assertSame(VendorStatus::Rejected, $vendor->getStatus());
        self::assertSame(UserStatus::Suspended, $vendor->getUser()->getStatus());
        self::assertFalse($vendor->isPublished());
    }

    public function test_reject_requires_at_least_one_reason(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Au moins une raison de refus est requise.');
        $this->expectExceptionCode(422);

        $this->makeService($this->createStub(EventDispatcherInterface::class), 0)
            ->reject($this->makeVendor(), [], null);
    }

    public function test_reject_rejects_unknown_reason(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Raison de refus inconnue : unsupported.');
        $this->expectExceptionCode(422);

        $this->makeService($this->createStub(EventDispatcherInterface::class), 0)
            ->reject($this->makeVendor(), ['unsupported'], null);
    }

    public function test_reject_allows_note_only_with_other_reason(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Une note ne peut être fournie qu’avec la raison "Autre".');
        $this->expectExceptionCode(422);

        $this->makeService($this->createStub(EventDispatcherInterface::class), 0)
            ->reject($this->makeVendor(), [VendorRejectionReason::PortfolioQuality->value], 'Note sans autre.');
    }

    private function makeService(EventDispatcherInterface $dispatcher, int $flushCount = 1): AdminVendorReviewService
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly($flushCount))->method('flush');

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
