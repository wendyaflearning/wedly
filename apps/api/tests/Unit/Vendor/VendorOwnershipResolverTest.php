<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use PHPUnit\Framework\TestCase;

final class VendorOwnershipResolverTest extends TestCase
{
    public function test_resolve_active_returns_active_vendor(): void
    {
        $user = new User();
        $vendor = (new Vendor())->setStatus(VendorStatus::Active);

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findOneByUser')->willReturn($vendor);

        $resolver = new VendorOwnershipResolver($repository);

        self::assertSame($vendor, $resolver->resolveActive($user));
    }

    public function test_resolve_active_rejects_vendor_under_review(): void
    {
        $user = new User();
        $vendor = (new Vendor())->setStatus(VendorStatus::UnderReview);

        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findOneByUser')->willReturn($vendor);

        $resolver = new VendorOwnershipResolver($repository);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(403);
        $this->expectExceptionMessage('Profil en attente de validation - cela peut prendre 24h à 48h.');

        $resolver->resolveActive($user);
    }
}
