<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Onboarding;

use App\Controller\Onboarding\PostVendorUnsubscribeAction;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorUnsubscribeService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class PostVendorUnsubscribeActionTest extends TestCase
{
    public function test_invoke_unsubscribes_the_vendor_and_returns_success(): void
    {
        $vendor = $this->makeVendor();
        $vendorId = $vendor->getId()->toRfc4122();

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with($vendorId)->willReturn($vendor);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $response = (new PostVendorUnsubscribeAction(new VendorUnsubscribeService($vendorRepository, $em)))
            ->__invoke($vendorId);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(
            ['unsubscribed' => true],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
        self::assertNotNull($vendor->getUser()->getUnsubscribedAt());
    }

    public function test_invoke_returns_the_same_success_when_already_unsubscribed(): void
    {
        $vendor = $this->makeVendor();
        $vendor->getUser()->setUnsubscribedAt(new \DateTimeImmutable('2026-08-01 10:00:00'));

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->willReturn($vendor);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new PostVendorUnsubscribeAction(new VendorUnsubscribeService($vendorRepository, $em)))
            ->__invoke($vendor->getId()->toRfc4122());

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(
            ['unsubscribed' => true],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_lets_the_domain_exception_bubble_up_to_the_listener(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $action = new PostVendorUnsubscribeAction(new VendorUnsubscribeService($vendorRepository, $em));

        // Aucun try/catch dans l'Action : c'est l'ExceptionListener qui formate le 404.
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->expectExceptionMessage('Prestataire introuvable.');

        $action->__invoke((new UuidV7())->toRfc4122());
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
