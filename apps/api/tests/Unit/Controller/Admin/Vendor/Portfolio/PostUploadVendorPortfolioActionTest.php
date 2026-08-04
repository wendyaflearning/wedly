<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Vendor\Portfolio;

use App\Controller\Admin\Vendor\Portfolio\PostUploadVendorPortfolioAction;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Uid\Uuid;

final class PostUploadVendorPortfolioActionTest extends TestCase
{
    public function test_invoke_returns_404_when_vendor_not_found(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('missing-id')->willReturn(null);

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('uploadPhoto');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new PostUploadVendorPortfolioAction($vendorRepository, $portfolioService, $em))
            ->__invoke('missing-id', new Request());

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Prestataire introuvable.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_uploads_photo_and_returns_201(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $file   = $this->createStub(UploadedFile::class);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $image = (new PortfolioImage())->setUrl('https://res.cloudinary.com/img.jpg')->setSortOrder(2);
        $imageId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $imageReflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $imageReflection->setAccessible(true);
        $imageReflection->setValue($image, $imageId);

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())
            ->method('uploadPhoto')
            ->with($vendor, $file, 2, ['style-1'], ['specialty-1'])
            ->willReturn($image);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $request = new Request(
            request: [
                'sortOrder'     => '2',
                'styleTags'     => ['style-1'],
                'specialtyTags' => ['specialty-1'],
            ],
            files: ['photo' => $file],
        );

        $response = (new PostUploadVendorPortfolioAction($vendorRepository, $portfolioService, $em))
            ->__invoke('vendor-id', $request);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame(
            [
                'id'        => $imageId->toRfc4122(),
                'url'       => 'https://res.cloudinary.com/img.jpg',
                'sortOrder' => 2,
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }
}
