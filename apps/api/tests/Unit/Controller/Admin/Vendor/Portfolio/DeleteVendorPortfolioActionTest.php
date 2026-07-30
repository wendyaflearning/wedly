<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Vendor\Portfolio;

use App\Controller\Admin\Vendor\Portfolio\DeleteVendorPortfolioAction;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class DeleteVendorPortfolioActionTest extends TestCase
{
    public function test_invoke_returns_404_when_vendor_not_found(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('missing-id')->willReturn(null);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->never())->method('findOneBy');

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('deletePhoto');
        $portfolioService->expects($this->never())->method('destroyCloudinaryAsset');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new DeleteVendorPortfolioAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('missing-id', 'image-id');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Prestataire introuvable.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_returns_404_when_image_not_found_or_out_of_scope(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn(null);

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('deletePhoto');
        $portfolioService->expects($this->never())->method('destroyCloudinaryAsset');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new DeleteVendorPortfolioAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('vendor-id', 'image-id');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Image introuvable.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_deletes_photo_flushes_then_destroys_cloudinary_asset_in_order(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $image  = $this->createStub(PortfolioImage::class);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn($image);

        $calls = [];

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())
            ->method('deletePhoto')
            ->with($image)
            ->willReturnCallback(function () use (&$calls): ?string {
                $calls[] = 'deletePhoto';

                return 'wedly/vendors/abc/img1';
            });
        $portfolioService->expects($this->once())
            ->method('destroyCloudinaryAsset')
            ->with('wedly/vendors/abc/img1')
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'destroyCloudinaryAsset';
            });

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('flush')
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'flush';
            });

        $response = (new DeleteVendorPortfolioAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('vendor-id', 'image-id');

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame(['deletePhoto', 'flush', 'destroyCloudinaryAsset'], $calls);
    }
}
