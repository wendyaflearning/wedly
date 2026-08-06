<?php

declare(strict_types=1);

namespace App\Tests\Unit\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorAutoTaggedService;
use App\Entity\Wedding\WeddingStyle;
use App\Exception\ValidationException;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\SpecialtyRepository;
use App\Service\PortfolioService;
use Cloudinary\Api\ApiResponse;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Cloudinary;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class PortfolioServiceTest extends TestCase
{
    private PortfolioImageRepository&Stub $repository;
    private SpecialtyRepository&Stub $specialtyRepository;

    protected function setUp(): void
    {
        $this->repository          = $this->createStub(PortfolioImageRepository::class);
        $this->specialtyRepository = $this->createStub(SpecialtyRepository::class);
    }

    private function makeService(
        EntityManagerInterface $em,
        LoggerInterface $logger,
        UploadApi $uploadApi,
    ): PortfolioService {
        $cloudinary = $this->createStub(Cloudinary::class);
        $cloudinary->method('uploadApi')->willReturn($uploadApi);

        return new PortfolioService($cloudinary, $em, $this->repository, $logger, $this->specialtyRepository);
    }

    private function makeSpecialty(Service $service): Specialty&Stub
    {
        $specialty = $this->createStub(Specialty::class);
        $specialty->method('getService')->willReturn($service);

        return $specialty;
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

    public function test_uploadPhoto_passes_optimization_options_to_cloudinary(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn(\Symfony\Component\Uid\Uuid::fromString('01930000-0000-7000-8000-000000000001'));
        $em        = $this->createStub(EntityManagerInterface::class);
        $uploadApi = $this->createMock(UploadApi::class);
        $uploadApi->expects($this->once())
            ->method('upload')
            ->with(
                '/tmp/photo.jpg',
                $this->callback(function (array $options): bool {
                    return isset($options['folder'], $options['quality'], $options['fetch_format'], $options['width'], $options['crop'])
                        && str_starts_with($options['folder'], 'wedly/vendors/')
                        && $options['quality'] === 'auto:good'
                        && $options['fetch_format'] === 'auto'
                        && $options['width'] === 2500
                        && $options['crop'] === 'limit';
                }),
            )
            ->willReturn($this->makeCloudinaryResponse());

        $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0);
    }

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

    public function test_uploadPhoto_auto_computes_sort_order_as_max_plus_one_to_handle_gaps(): void
    {
        $vendor    = $this->createStub(Vendor::class);
        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('upload')->willReturn($this->makeCloudinaryResponse());
        $this->repository->method('findByVendor')->willReturn([
            (new PortfolioImage())->setSortOrder(0)->setUrl('https://example.com/1.jpg'),
            (new PortfolioImage())->setSortOrder(1)->setUrl('https://example.com/2.jpg'),
            (new PortfolioImage())->setSortOrder(4)->setUrl('https://example.com/3.jpg'),
        ]);

        $image = $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile());

        $this->assertSame(5, $image->getSortOrder());
    }

    // --- uploadPhoto() tagging ---

    public function test_uploadPhoto_persists_specialty_and_style_tags_within_scope(): void
    {
        $service   = $this->createStub(Service::class);
        $vendor    = $this->createStub(Vendor::class);
        $vendor->method('getServices')->willReturn(new ArrayCollection([$service]));

        $specialty = $this->makeSpecialty($service);
        $this->specialtyRepository->method('find')->willReturn($specialty);

        $style      = $this->createStub(WeddingStyle::class);
        $styleRepo  = $this->createStub(EntityRepository::class);
        $styleRepo->method('find')->willReturn($style);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($styleRepo);

        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('upload')->willReturn($this->makeCloudinaryResponse());

        // TODO WED-100: $image ne porte plus getSpecialties()/getStyles() depuis la suppression de
        // portfolio_image_specialty/portfolio_image_style (WED-97) — assertions de tagging à réintroduire
        // via TagValue une fois le mapping fait. On vérifie ici juste que la résolution ne lève pas.
        $image = $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0, ['style-1'], ['specialty-1']);

        $this->assertInstanceOf(PortfolioImage::class, $image);
    }

    public function test_uploadPhoto_throws_422_when_more_than_two_specialty_tags(): void
    {
        $this->expectException(ValidationException::class);

        $vendor    = $this->createStub(Vendor::class);
        $uploadApi = $this->createStub(UploadApi::class);

        $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0, [], ['s1', 's2', 's3']);
    }

    public function test_uploadPhoto_throws_422_when_specialty_tag_does_not_exist(): void
    {
        $this->expectException(ValidationException::class);

        $vendor = $this->createStub(Vendor::class);
        $this->specialtyRepository->method('find')->willReturn(null);
        $uploadApi = $this->createStub(UploadApi::class);

        $this->makeService($this->createStub(EntityManagerInterface::class), $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0, [], ['unknown']);
    }

    public function test_uploadPhoto_auto_associates_service_and_records_auto_tag_when_vendor_lacks_service(): void
    {
        $vendorService = $this->createStub(Service::class);
        $services      = new ArrayCollection();

        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getServices')->willReturnCallback(static fn () => $services);
        $vendor->method('addService')->willReturnCallback(static function (Service $service) use ($services, &$vendor) {
            $services->add($service);

            return $vendor;
        });

        $specialty = $this->makeSpecialty($vendorService);
        $this->specialtyRepository->method('find')->willReturn($specialty);

        $persisted = [];
        $em        = $this->createStub(EntityManagerInterface::class);
        $em->method('persist')->willReturnCallback(static function (object $entity) use (&$persisted): void {
            $persisted[] = $entity;
        });

        $uploadApi = $this->createStub(UploadApi::class);
        $uploadApi->method('upload')->willReturn($this->makeCloudinaryResponse());

        $image = $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0, [], ['specialty-1']);

        $this->assertTrue($services->contains($vendorService));

        $autoTags = array_values(array_filter($persisted, static fn ($entity) => $entity instanceof VendorAutoTaggedService));
        $this->assertCount(1, $autoTags);
        $this->assertSame($vendor, $autoTags[0]->getVendor());
        $this->assertSame($vendorService, $autoTags[0]->getService());
    }

    public function test_uploadPhoto_throws_422_when_style_tag_does_not_exist(): void
    {
        $this->expectException(ValidationException::class);

        $vendor    = $this->createStub(Vendor::class);
        $styleRepo = $this->createStub(EntityRepository::class);
        $styleRepo->method('find')->willReturn(null);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($styleRepo);
        $uploadApi = $this->createStub(UploadApi::class);

        $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)
            ->uploadPhoto($vendor, $this->makeFile(), 0, ['unknown'], []);
    }

    // --- deletePhoto() ---

    public function test_deletePhoto_queues_db_removal_and_returns_public_id(): void
    {
        $em        = $this->createMock(EntityManagerInterface::class);
        $uploadApi = $this->createMock(UploadApi::class);
        $image     = (new PortfolioImage())
            ->setCloudinaryPublicId('wedly/vendors/abc/img1')
            ->setUrl('https://example.com/img1.jpg')
            ->setSortOrder(1);

        $em->expects($this->once())->method('remove')->with($image);
        $uploadApi->expects($this->never())->method('destroy');

        $publicId = $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)->deletePhoto($image);

        $this->assertSame('wedly/vendors/abc/img1', $publicId);
    }

    public function test_deletePhoto_queues_db_removal_and_returns_null_when_no_public_id(): void
    {
        $em        = $this->createMock(EntityManagerInterface::class);
        $uploadApi = $this->createMock(UploadApi::class);
        $image     = (new PortfolioImage())
            ->setUrl('https://example.com/img1.jpg')
            ->setSortOrder(1);

        $em->expects($this->once())->method('remove')->with($image);
        $uploadApi->expects($this->never())->method('destroy');

        $publicId = $this->makeService($em, $this->createStub(LoggerInterface::class), $uploadApi)->deletePhoto($image);

        $this->assertNull($publicId);
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
