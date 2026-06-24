<?php

declare(strict_types=1);

namespace App\Tests\Unit\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use Cloudinary\Api\ApiResponse;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class PortfolioServiceTest extends TestCase
{
    private PortfolioImageRepository&Stub $repository;

    protected function setUp(): void
    {
        $this->repository = $this->createStub(PortfolioImageRepository::class);
    }

    private function makeService(
        EntityManagerInterface $em,
        LoggerInterface $logger,
        UploadApi $uploadApi,
    ): PortfolioService {
        $cloudinary = $this->createStub(Cloudinary::class);
        $cloudinary->method('uploadApi')->willReturn($uploadApi);

        return new PortfolioService($cloudinary, $em, $this->repository, $logger);
    }

    private function makeFile(): UploadedFile&Stub
    {
        $file = $this->createStub(UploadedFile::class);
        $file->method('getPathname')->willReturn('/tmp/photo.jpg');

        return $file;
    }

    private function makeCloudinaryResponse(string $url = 'https://res.cloudinary.com/img.jpg', string $publicId = 'wedly/img1'): ApiResponse
    {
        return new ApiResponse(['secure_url' => $url, 'public_id' => $publicId], []);
    }

    // --- uploadPhoto() ---

    public function test_uploadPhoto_uses_provided_sort_order(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $em        = $this->createMock(EntityManagerInterface::class);
        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('upload')->willReturn($this->makeCloudinaryResponse());

        $em->expects($this->once())->method('persist')->with($this->isInstanceOf(PortfolioImage::class));

        $image = $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 5);

        $this->assertSame(5, $image->getSortOrder());
        $this->assertSame('https://res.cloudinary.com/img.jpg', $image->getUrl());
        $this->assertSame('wedly/img1', $image->getCloudinaryPublicId());
        $this->assertFalse($image->isCover());
    }

    public function test_uploadPhoto_auto_computes_sort_order_from_existing_image_count(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('upload')->willReturn($this->makeCloudinaryResponse());
        $this->repository->method('findByVendor')->willReturn([
            new PortfolioImage(),
            new PortfolioImage(),
            new PortfolioImage(),
        ]);

        $image = $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile());

        $this->assertSame(3, $image->getSortOrder());
    }

    // --- deletePhoto() ---

    public function test_deletePhoto_queues_db_removal_and_destroys_cloudinary_asset(): void
    {
        $em        = $this->createMock(EntityManagerInterface::class);
        $uploadApi = $this->createMock(UploadApi::class);
        $image     = (new PortfolioImage())
            ->setCloudinaryPublicId('wedly/vendors/abc/img1')
            ->setUrl('https://example.com/img1.jpg')
            ->setSortOrder(1);

        $em->expects($this->once())->method('remove')->with($image);
        $uploadApi->expects($this->once())->method('destroy')->with('wedly/vendors/abc/img1');

        $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)->deletePhoto($image);
    }

    public function test_deletePhoto_skips_cloudinary_when_public_id_is_null(): void
    {
        $em        = $this->createMock(EntityManagerInterface::class);
        $uploadApi = $this->createMock(UploadApi::class);
        $image     = (new PortfolioImage())
            ->setUrl('https://example.com/img1.jpg')
            ->setSortOrder(1);

        $em->expects($this->once())->method('remove')->with($image);
        $uploadApi->expects($this->never())->method('destroy');

        $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)->deletePhoto($image);
    }

    // --- destroyCloudinaryAsset() ---

    public function test_destroyCloudinaryAsset_does_nothing_when_public_id_is_null(): void
    {
        $uploadApi = $this->createMock(UploadApi::class);
        $logger    = $this->createMock(LoggerInterface::class);

        $uploadApi->expects($this->never())->method('destroy');
        $logger->expects($this->never())->method('warning');

        $this->makeService($this->createStub(EntityManagerInterface::class), $logger, $uploadApi)
            ->destroyCloudinaryAsset(null);
    }

    public function test_destroyCloudinaryAsset_calls_cloudinary_destroy(): void
    {
        $uploadApi = $this->createMock(UploadApi::class);
        $uploadApi->expects($this->once())->method('destroy')->with('wedly/vendors/abc/img1');

        $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $uploadApi)
            ->destroyCloudinaryAsset('wedly/vendors/abc/img1');
    }

    public function test_destroyCloudinaryAsset_logs_warning_on_failure_without_throwing(): void
    {
        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('destroy')->willThrowException(new \RuntimeException('Network error'));
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning')->with(
            'Cloudinary destroy failed',
            $this->arrayHasKey('public_id'),
        );

        $this->makeService($this->createStub(EntityManagerInterface::class), $logger, $uploadApi)
            ->destroyCloudinaryAsset('wedly/vendors/abc/img1');
    }

    // --- setCover() ---

    public function test_setCover_deactivates_all_existing_covers_and_activates_target(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $existing1 = (new PortfolioImage())->setIsCover(true)->setSortOrder(0)->setUrl('https://example.com/1.jpg');
        $existing2 = (new PortfolioImage())->setIsCover(true)->setSortOrder(1)->setUrl('https://example.com/2.jpg');
        $target    = (new PortfolioImage())->setIsCover(false)->setSortOrder(2)->setUrl('https://example.com/3.jpg');

        $this->repository->method('findByVendor')->willReturn([$existing1, $existing2, $target]);

        $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $this->createStub(UploadApi::class))
            ->setCover($target, $vendor);

        $this->assertFalse($existing1->isCover());
        $this->assertFalse($existing2->isCover());
        $this->assertTrue($target->isCover());
    }
}
