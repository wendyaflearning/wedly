<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorProfileCompletionService;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;

final class VendorProfileCompletionServiceTest extends TestCase
{
    private function makeService(
        ?VendorRepository $repository = null,
        ?PortfolioStepHandler $portfolioHandler = null,
        ?ZonesPricingStepHandler $zonesHandler = null,
    ): VendorProfileCompletionService {
        $repository      ??= $this->createStub(VendorRepository::class);
        $portfolioHandler ??= $this->createStub(PortfolioStepHandler::class);
        $zonesHandler    ??= $this->createStub(ZonesPricingStepHandler::class);

        return new VendorProfileCompletionService($repository, $portfolioHandler, $zonesHandler);
    }

    private function makeVendor(?string $bio = null): Vendor
    {
        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getBio')->willReturn($bio);
        $vendor->method('getStyles')->willReturn(new ArrayCollection());

        return $vendor;
    }

    public function test_check_returns_bio_true_when_bio_is_set(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: 'Une belle bio');

        $result = $service->check($vendor, []);

        $this->assertTrue($result['bio']);
    }

    public function test_check_returns_bio_false_when_bio_is_null(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: null);

        $result = $service->check($vendor, []);

        $this->assertFalse($result['bio']);
    }

    public function test_check_returns_bio_false_when_bio_is_blank(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: '   ');

        $result = $service->check($vendor, []);

        $this->assertFalse($result['bio']);
    }

    public function test_check_uses_preloaded_booking_blockers_and_skips_repository(): void
    {
        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->never())->method('countBookingBlockersByVendor');

        $service = $this->makeService(repository: $repository);
        $vendor  = $this->makeVendor();

        $result = $service->check($vendor, [new \stdClass()]);

        $this->assertTrue($result['disponibilites']);
    }

    public function test_check_calls_repository_when_preloaded_blockers_is_null(): void
    {
        $repository = $this->createMock(VendorRepository::class);
        $repository->expects($this->once())
            ->method('countBookingBlockersByVendor')
            ->willReturn(2);

        $service = $this->makeService(repository: $repository);
        $vendor  = $this->makeVendor();

        $result = $service->check($vendor, null);

        $this->assertTrue($result['disponibilites']);
    }

    public function test_check_for_publish_excludes_styles_key(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: 'Bio');

        $result = $service->checkForPublish($vendor);

        $this->assertArrayNotHasKey('styles', $result);
        $this->assertArrayHasKey('bio', $result);
        $this->assertArrayHasKey('portfolio', $result);
        $this->assertArrayHasKey('disponibilites', $result);
        $this->assertArrayHasKey('zone', $result);
        $this->assertArrayHasKey('tarifs', $result);
    }
}
