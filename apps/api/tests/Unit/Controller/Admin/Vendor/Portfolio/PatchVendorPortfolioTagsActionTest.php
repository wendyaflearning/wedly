<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Vendor\Portfolio;

use App\Controller\Admin\Vendor\Portfolio\PatchVendorPortfolioTagsAction;
use App\DTO\Admin\Vendor\Portfolio\PatchVendorPortfolioTagsRequestDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Specialty;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\WeddingStyle;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;

final class PatchVendorPortfolioTagsActionTest extends TestCase
{
    public function test_invoke_returns_404_when_vendor_not_found(): void
    {
        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('missing-id')->willReturn(null);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->never())->method('findOneBy');

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('updateTags');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new PatchVendorPortfolioTagsAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('missing-id', 'image-id', new PatchVendorPortfolioTagsRequestDto());

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
        $portfolioService->expects($this->never())->method('updateTags');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new PatchVendorPortfolioTagsAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('vendor-id', 'image-id', new PatchVendorPortfolioTagsRequestDto());

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Image introuvable.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_calls_update_tags_flushes_then_returns_200_with_tags(): void
    {
        $vendor = $this->createStub(Vendor::class);

        $style = $this->createStub(WeddingStyle::class);
        $style->method('getId')->willReturn(Uuid::fromString('01930000-0000-7000-8000-000000000010'));
        $style->method('getName')->willReturn('Bohème');
        $style->method('getSlug')->willReturn('boheme');

        $specialty = $this->createStub(Specialty::class);
        $specialty->method('getId')->willReturn(Uuid::fromString('01930000-0000-7000-8000-000000000020'));
        $specialty->method('getName')->willReturn('Mariage laïc');
        $specialty->method('getSlug')->willReturn('mariage-laic');

        $image = (new PortfolioImage())
            ->setUrl('https://res.cloudinary.com/img.jpg')
            ->setIsCover(false);
        $image->addStyle($style);
        $image->addSpecialty($specialty);

        $imageId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $imageReflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $imageReflection->setAccessible(true);
        $imageReflection->setValue($image, $imageId);

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())->method('find')->with('vendor-id')->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn($image);

        $dto = new PatchVendorPortfolioTagsRequestDto(styleIds: ['style-1'], specialtyIds: ['specialty-1']);

        $calls = [];

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())
            ->method('updateTags')
            ->with($vendor, $image, $dto->styleIds, $dto->specialtyIds)
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'updateTags';
            });

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('flush')
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'flush';
            });

        $response = (new PatchVendorPortfolioTagsAction($vendorRepository, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke('vendor-id', 'image-id', $dto);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['updateTags', 'flush'], $calls);
        $this->assertSame(
            [
                'id'      => $imageId->toRfc4122(),
                'url'     => 'https://res.cloudinary.com/img.jpg',
                'isCover' => false,
                'styles' => [
                    ['id' => '01930000-0000-7000-8000-000000000010', 'name' => 'Bohème', 'slug' => 'boheme'],
                ],
                'specialties' => [
                    ['id' => '01930000-0000-7000-8000-000000000020', 'name' => 'Mariage laïc', 'slug' => 'mariage-laic'],
                ],
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }
}
