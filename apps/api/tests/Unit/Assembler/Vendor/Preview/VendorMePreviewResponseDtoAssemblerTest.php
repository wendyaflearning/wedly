<?php

declare(strict_types=1);

namespace App\Tests\Unit\Assembler\Vendor\Preview;

use App\Assembler\Vendor\Preview\VendorMePreviewResponseDtoAssembler;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorType;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorProfileCompletionService;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class VendorMePreviewResponseDtoAssemblerTest extends TestCase
{
    public function test_completion_mirrors_the_publish_check_and_omits_styles(): void
    {
        $dto = $this->assemble();

        $this->assertArrayNotHasKey(
            'styles',
            $dto->completion,
            "L'aperçu doit exposer exactement les sections qui conditionnent la publication.",
        );
        $this->assertSame(
            ['bio', 'portfolio', 'disponibilites', 'zone', 'tarifs'],
            array_keys($dto->completion),
        );
    }

    public function test_it_exposes_the_published_flag(): void
    {
        $this->assertTrue($this->assemble(isPublished: true)->is_published);
        $this->assertFalse($this->assemble(isPublished: false)->is_published);
    }

    private function assemble(bool $isPublished = false): \App\DTO\Vendor\Preview\VendorMePreviewResponseDto
    {
        $repository = $this->createStub(VendorRepository::class);
        $repository->method('findBookingBlockersByVendor')->willReturn([]);

        $portfolioHandler = $this->createStub(PortfolioStepHandler::class);
        $portfolioHandler->method('isFilled')->willReturn(true);

        $zonesHandler = $this->createStub(ZonesPricingStepHandler::class);
        $zonesHandler->method('isFilled')->willReturn(true);

        $completionService = new VendorProfileCompletionService($portfolioHandler, $zonesHandler);

        $assembler = new VendorMePreviewResponseDtoAssembler($repository, $completionService);

        return $assembler->assemble($this->makeVendor($isPublished));
    }

    private function makeVendor(bool $isPublished): Vendor
    {
        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn(new UuidV7('0198f0a1-0000-7000-8000-0000000000aa'));
        $vendor->method('getBrandName')->willReturn('Studio Lumière');
        $vendor->method('getBio')->willReturn('Une belle bio');
        $vendor->method('resolveVendorType')->willReturn(VendorType::Freelance);
        $vendor->method('resolveVendorServices')->willReturn([]);
        $vendor->method('getStyles')->willReturn(new ArrayCollection());
        $vendor->method('getPortfolioImages')->willReturn(new ArrayCollection());
        $vendor->method('getRegions')->willReturn(new ArrayCollection());
        $vendor->method('getPriceMinCents')->willReturn(100000);
        $vendor->method('getPriceMaxCents')->willReturn(250000);
        $vendor->method('getPriceType')->willReturn(PriceType::PerService);
        $vendor->method('isPublished')->willReturn($isPublished);

        return $vendor;
    }
}
