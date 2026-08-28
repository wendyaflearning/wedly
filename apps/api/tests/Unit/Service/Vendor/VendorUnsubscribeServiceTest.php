<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorUnsubscribeService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class VendorUnsubscribeServiceTest extends TestCase
{
    public function test_unsubscribe_marks_the_user_and_flushes(): void
    {
        $vendor = $this->makeVendor();
        $vendorId = $vendor->getId()->toRfc4122();

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('find')
            ->with($vendorId)
            ->willReturn($vendor);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())->method('flush');

        (new VendorUnsubscribeService($vendorRepository, $entityManager))->unsubscribeByVendorId($vendorId);

        self::assertNotNull($vendor->getUser()->getUnsubscribedAt());
    }

    public function test_unsubscribe_is_idempotent_and_preserves_the_original_date(): void
    {
        $alreadyUnsubscribedAt = new \DateTimeImmutable('2026-08-01 10:00:00');
        $vendor = $this->makeVendor();
        $vendor->getUser()->setUnsubscribedAt($alreadyUnsubscribedAt);
        $vendorId = $vendor->getId()->toRfc4122();

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->willReturn($vendor);

        // Un lien de désinscription cliqué deux fois n'est pas une erreur : succès,
        // aucune écriture, et la date d'origine n'est pas écrasée.
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        (new VendorUnsubscribeService($vendorRepository, $entityManager))->unsubscribeByVendorId($vendorId);

        self::assertSame($alreadyUnsubscribedAt, $vendor->getUser()->getUnsubscribedAt());
    }

    public function test_unsubscribe_throws_404_when_vendor_is_unknown(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->willReturn(null);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->never())->method('flush');

        $service = new VendorUnsubscribeService($vendorRepository, $entityManager);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Prestataire introuvable.');

        $service->unsubscribeByVendorId((new UuidV7())->toRfc4122());
    }

    private function makeVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.fr')
            ->setPassword('password');
        $this->setPrivateProperty($user, 'id', new UuidV7());

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Camille')
            ->setStatus(VendorStatus::Active)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100000)
            ->setPriceMaxCents(250000);
        $this->setPrivateProperty($vendor, 'id', new UuidV7());

        return $vendor;
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
