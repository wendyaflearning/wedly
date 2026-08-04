<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\Vendor\Vendor;
use App\Service\Vendor\VendorPublishService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class VendorPublishServiceTest extends TestCase
{
    public function test_publish_sets_is_published_and_flushes(): void
    {
        $vendor = $this->createMock(Vendor::class);
        $vendor->expects($this->once())->method('setIsPublished')->with(true);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $service = new VendorPublishService($em);
        $service->publish($vendor);
    }
}
