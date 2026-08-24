<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Dashboard;

use App\Controller\Vendor\Dashboard\PatchVendorDashboardWedreamVisibilityAction;
use App\DTO\Vendor\Dashboard\WedreamVisibilityRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Service\Vendor\VendorOwnershipResolver;
use App\Service\Vendor\VendorWedreamVisibilityService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;

final class PatchVendorDashboardWedreamVisibilityActionTest extends TestCase
{
    public function test_invoke_enables_visibility_and_returns_200(): void
    {
        $vendor = new Vendor();
        $user   = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $response = (new PatchVendorDashboardWedreamVisibilityAction(
            $security,
            $vendorOwnershipResolver,
            new VendorWedreamVisibilityService($em),
        ))->__invoke(new WedreamVisibilityRequestDto(enabled: true));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('{"wedream_enabled":true}', $response->getContent());
        $this->assertTrue($vendor->isWedreamEnabled());
    }

    public function test_invoke_disables_visibility_without_touching_the_portfolio(): void
    {
        $vendor = (new Vendor())->setWedreamEnabled(true);
        $user   = $this->createStub(User::class);

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createStub(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->method('resolve')->willReturn($vendor);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $response = (new PatchVendorDashboardWedreamVisibilityAction(
            $security,
            $vendorOwnershipResolver,
            new VendorWedreamVisibilityService($em),
        ))->__invoke(new WedreamVisibilityRequestDto(enabled: false));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('{"wedream_enabled":false}', $response->getContent());
        $this->assertFalse($vendor->isWedreamEnabled());
        $this->assertCount(0, $vendor->getPortfolioImages());
    }

    public function test_invoke_lets_the_ownership_resolver_reject_a_non_vendor_user(): void
    {
        $user = $this->createStub(User::class);

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createStub(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->method('resolve')
            ->willThrowException(new \DomainException('Accès interdit.', 403));

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(403);

        (new PatchVendorDashboardWedreamVisibilityAction(
            $security,
            $vendorOwnershipResolver,
            new VendorWedreamVisibilityService($em),
        ))->__invoke(new WedreamVisibilityRequestDto(enabled: true));
    }
}
