<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Service\Vendor\VendorProfileCompletionService;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;

final class VendorProfileCompletionServiceTest extends TestCase
{
    private function makeService(
        ?PortfolioStepHandler $portfolioHandler = null,
        ?ZonesPricingStepHandler $zonesHandler = null,
    ): VendorProfileCompletionService {
        $portfolioHandler ??= $this->createStub(PortfolioStepHandler::class);
        $zonesHandler     ??= $this->createStub(ZonesPricingStepHandler::class);

        return new VendorProfileCompletionService($portfolioHandler, $zonesHandler);
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

        $result = $service->check($vendor);

        $this->assertTrue($result['bio']);
    }

    public function test_check_returns_bio_false_when_bio_is_null(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: null);

        $result = $service->check($vendor);

        $this->assertFalse($result['bio']);
    }

    public function test_check_returns_bio_false_when_bio_is_blank(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: '   ');

        $result = $service->check($vendor);

        $this->assertFalse($result['bio']);
    }

    public function test_check_considers_disponibilites_filled_without_any_booking_blocker(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor();

        $result = $service->check($vendor);

        $this->assertTrue(
            $result['disponibilites'],
            'Aucune indisponibilité déclarée signifie disponible partout — le critère est satisfait.',
        );
    }

    public function test_check_for_publish_does_not_block_on_disponibilites(): void
    {
        $service = $this->makeService();
        $vendor  = $this->makeVendor(bio: 'Bio');

        $result = $service->checkForPublish($vendor);

        $this->assertArrayHasKey('disponibilites', $result);
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

    public function test_check_for_publish_is_true_everywhere_on_a_complete_profile(): void
    {
        $portfolioHandler = $this->createStub(PortfolioStepHandler::class);
        $portfolioHandler->method('isFilled')->willReturn(true);

        $zonesHandler = $this->createStub(ZonesPricingStepHandler::class);
        $zonesHandler->method('isFilled')->willReturn(true);

        $service = $this->makeService($portfolioHandler, $zonesHandler);
        $vendor  = $this->makeVendor(bio: 'Une belle bio');

        $result = $service->checkForPublish($vendor);

        $this->assertNotContains(false, $result, 'Un profil complet sans styles ni indisponibilités doit pouvoir publier.');
    }
}
