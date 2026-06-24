<?php

declare(strict_types=1);

namespace App\Tests\Unit\Portfolio;

use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\PortfolioStepHandler;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PortfolioStepHandlerUploadTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private PortfolioImageRepository&Stub $repository;
    private PortfolioService&MockObject $portfolioService;

    protected function setUp(): void
    {
        $this->em               = $this->createMock(EntityManagerInterface::class);
        $this->repository       = $this->createStub(PortfolioImageRepository::class);
        $this->portfolioService = $this->createMock(PortfolioService::class);
    }

    private function makeHandler(): PortfolioStepHandler
    {
        return new PortfolioStepHandler(
            $this->em,
            $this->repository,
            $this->portfolioService,
            $this->createStub(ValidatorInterface::class),
        );
    }

    private function makeFile(): UploadedFile&Stub
    {
        return $this->createStub(UploadedFile::class);
    }

    /**
     * Critical ordering test: if the new cover upload fails, the old Cloudinary asset
     * must NOT be destroyed, since the DB still references it.
     */
    public function test_upload_does_not_destroy_old_cloudinary_asset_when_new_upload_fails(): void
    {
        $vendor        = $this->createStub(Vendor::class);
        $existingCover = (new PortfolioImage())
            ->setIsCover(true)
            ->setSortOrder(0)
            ->setCloudinaryPublicId('old-cover-id')
            ->setUrl('https://example.com/old-cover.jpg');

        $this->repository->method('findByVendor')->willReturn([$existingCover]);

        $this->portfolioService
            ->method('uploadPhoto')
            ->willThrowException(new \DomainException('Échec de l\'upload Cloudinary', 500));

        $this->portfolioService->expects($this->never())->method('destroyCloudinaryAsset');
        $this->em->expects($this->never())->method('flush');

        $this->expectException(\DomainException::class);

        $dto = new PortfolioStepRequestDto(coverPhoto: $this->makeFile(), photos: []);
        $this->makeHandler()->upload($vendor, $dto);
    }

    /**
     * Happy path: when a new cover replaces an old one, the old Cloudinary asset
     * is destroyed only AFTER the DB flush succeeds.
     */
    public function test_upload_destroys_old_cloudinary_asset_after_flush_on_cover_replacement(): void
    {
        $vendor        = $this->createStub(Vendor::class);
        $existingCover = (new PortfolioImage())
            ->setIsCover(true)
            ->setSortOrder(0)
            ->setCloudinaryPublicId('old-cover-id')
            ->setUrl('https://example.com/old-cover.jpg');

        $newCover = new PortfolioImage();

        $this->repository->method('findByVendor')->willReturnOnConsecutiveCalls(
            [$existingCover],
            [$newCover],
        );

        $this->portfolioService->method('uploadPhoto')->willReturn($newCover);

        $this->em->expects($this->once())->method('remove')->with($existingCover);
        $this->em->expects($this->atLeastOnce())->method('flush');
        $this->portfolioService->expects($this->once())->method('destroyCloudinaryAsset')->with('old-cover-id');

        $dto = new PortfolioStepRequestDto(coverPhoto: $this->makeFile(), photos: []);
        $this->makeHandler()->upload($vendor, $dto);
    }
}
