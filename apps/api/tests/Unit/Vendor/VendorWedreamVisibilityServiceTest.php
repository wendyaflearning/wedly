<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\Vendor\Vendor;
use App\Service\Vendor\VendorWedreamVisibilityService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class VendorWedreamVisibilityServiceTest extends TestCase
{
    public function test_set_visibility_enables_the_flag_and_flushes(): void
    {
        $vendor = $this->createMock(Vendor::class);
        $vendor->expects($this->once())->method('setWedreamEnabled')->with(true);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        (new VendorWedreamVisibilityService($em))->setVisibility($vendor, true);
    }

    public function test_set_visibility_disables_the_flag_without_touching_portfolio(): void
    {
        $vendor = $this->createMock(Vendor::class);
        $vendor->expects($this->once())->method('setWedreamEnabled')->with(false);
        $vendor->expects($this->never())->method('getPortfolioImages');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        (new VendorWedreamVisibilityService($em))->setVisibility($vendor, false);
    }
}
