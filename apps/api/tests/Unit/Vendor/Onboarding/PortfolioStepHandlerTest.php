<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PortfolioStepHandlerTest extends TestCase
{
    public function test_supports_portfolio_step(): void
    {
        $handler = $this->makeHandler(
            $this->createStub(EntityManagerInterface::class),
            $this->createStub(PortfolioImageRepository::class),
            $this->createStub(PortfolioService::class)
        );

        $this->assertSame(OnboardingStep::Portfolio, $handler->supports());
    }

    public function test_handle_rejects_generic_dispatcher_usage(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(400);
        $this->expectExceptionMessage('Cette étape utilise un endpoint dédié (/portfolio). Utilisez le bon endpoint.');

        $this->makeHandler(
            $this->createStub(EntityManagerInterface::class),
            $this->createStub(PortfolioImageRepository::class),
            $this->createStub(PortfolioService::class)
        )->handle(new Vendor(), []);
    }

    public function test_get_step_data_returns_empty_array_when_vendor_has_no_images(): void
    {
        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->once())->method('findByVendor')->willReturn([]);

        $result = $this->makeHandler(
            $this->createStub(EntityManagerInterface::class),
            $repository,
            $this->createStub(PortfolioService::class)
        )->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_get_step_data_returns_portfolio_images_payload(): void
    {
        $image = $this->imageWithId('https://example.com/photo.jpg', isCover: true, sortOrder: 0);

        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->once())->method('findByVendor')->willReturn([$image]);

        $result = $this->makeHandler(
            $this->createStub(EntityManagerInterface::class),
            $repository,
            $this->createStub(PortfolioService::class)
        )->getStepData(new Vendor());

        $this->assertSame('https://example.com/photo.jpg', $result['images'][0]['url']);
        $this->assertTrue($result['images'][0]['is_cover']);
        $this->assertSame(0, $result['images'][0]['sort_order']);
        $this->assertIsString($result['images'][0]['id']);
    }

    public function test_upload_requires_cover_when_no_existing_cover_exists(): void
    {
        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->once())->method('findByVendor')->willReturn([]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Une photo de couverture est requise.');

        $this->makeHandler(
            $this->createStub(EntityManagerInterface::class),
            $repository,
            $this->createStub(PortfolioService::class)
        )->upload(new Vendor(), new PortfolioStepRequestDto(null, []));
    }

    public function test_upload_marks_portfolio_step_complete_when_cover_and_two_secondary_images_exist(): void
    {
        $vendor = new Vendor();
        $existingCover = $this->imageWithId('https://example.com/cover.jpg', isCover: true, sortOrder: 0);
        $secondaryOne = $this->imageWithId('https://example.com/one.jpg', isCover: false, sortOrder: 1);
        $secondaryTwo = $this->imageWithId('https://example.com/two.jpg', isCover: false, sortOrder: 2);

        $repository = $this->createMock(PortfolioImageRepository::class);
        $repository->expects($this->exactly(2))
            ->method('findByVendor')
            ->willReturnOnConsecutiveCalls(
                [$existingCover, $secondaryOne],
                [$existingCover, $secondaryOne, $secondaryTwo],
            );

        $uploadedSecondary = $this->imageWithId('https://example.com/two.jpg', isCover: false, sortOrder: 2);
        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())
            ->method('uploadPhoto')
            ->with($vendor, $this->isInstanceOf(UploadedFile::class), 2)
            ->willReturn($uploadedSecondary);
        $portfolioService->expects($this->once())->method('destroyCloudinaryAsset')->with(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))->method('flush');

        $this->makeHandler($em, $repository, $portfolioService)->upload(
            $vendor,
            new PortfolioStepRequestDto(null, [$this->createStub(UploadedFile::class)])
        );

        $this->assertSame(OnboardingStep::Portfolio, $vendor->getOnboardingStep());
    }

    private function makeHandler(
        EntityManagerInterface $em,
        PortfolioImageRepository $repository,
        PortfolioService $portfolioService,
    ): PortfolioStepHandler {
        return new PortfolioStepHandler(
            $em,
            $repository,
            $portfolioService,
            $this->createStub(ValidatorInterface::class)
        );
    }

    private function imageWithId(string $url, bool $isCover, int $sortOrder): PortfolioImage
    {
        $image = (new PortfolioImage())
            ->setUrl($url)
            ->setIsCover($isCover)
            ->setSortOrder($sortOrder);

        $id = new \ReflectionProperty(PortfolioImage::class, 'id');
        $id->setValue($image, new UuidV7());

        return $image;
    }
}
