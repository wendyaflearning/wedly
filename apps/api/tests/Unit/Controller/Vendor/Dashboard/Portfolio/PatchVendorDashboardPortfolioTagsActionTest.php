<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Dashboard\Portfolio;

use App\Controller\Vendor\Dashboard\Portfolio\PatchVendorDashboardPortfolioTagsAction;
use App\DTO\Vendor\Portfolio\PatchPortfolioTagsRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\PortfolioService;
use App\Service\Vendor\VendorOwnershipResolver;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;

final class PatchVendorDashboardPortfolioTagsActionTest extends TestCase
{
    public function test_invoke_returns_404_when_image_not_found_or_out_of_scope(): void
    {
        $vendorId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $vendor   = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn($vendorId);

        $user = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn(null);

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('updatePortfolioTags');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $response = (new PatchVendorDashboardPortfolioTagsAction($security, $vendorOwnershipResolver, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke($vendorId->toRfc4122(), 'image-id', new PatchPortfolioTagsRequestDto());

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Image introuvable.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_calls_update_portfolio_tags_flushes_then_returns_200_with_tags(): void
    {
        $vendorId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $vendor   = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn($vendorId);

        $user = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $image = (new PortfolioImage())
            ->setUrl('https://res.cloudinary.com/img.jpg')
            ->setIsCover(false);

        $imageId          = Uuid::fromString('01930000-0000-7000-8000-000000000002');
        $imageReflection  = new \ReflectionProperty(PortfolioImage::class, 'id');
        $imageReflection->setAccessible(true);
        $imageReflection->setValue($image, $imageId);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findOneBy')
            ->with(['id' => 'image-id', 'vendor' => $vendor])
            ->willReturn($image);

        $dto = new PatchPortfolioTagsRequestDto(tagValueIds: ['tag-value-1']);

        $calls = [];

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->once())
            ->method('updatePortfolioTags')
            ->with($image, $dto->tagValueIds)
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'updatePortfolioTags';
            });

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('flush')
            ->willReturnCallback(function () use (&$calls): void {
                $calls[] = 'flush';
            });

        $response = (new PatchVendorDashboardPortfolioTagsAction($security, $vendorOwnershipResolver, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke($vendorId->toRfc4122(), 'image-id', $dto);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['updatePortfolioTags', 'flush'], $calls);
        $this->assertSame(
            [
                'id'                 => $imageId->toRfc4122(),
                'url'                => 'https://res.cloudinary.com/img.jpg',
                'isCover'            => false,
                'isVisibleInWedream' => false,
                'tags'               => [],
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_returns_403_when_id_does_not_match_resolved_vendor(): void
    {
        $resolvedVendorId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $vendor            = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn($resolvedVendorId);

        $user = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->never())->method('findOneBy');

        $portfolioService = $this->createMock(PortfolioService::class);
        $portfolioService->expects($this->never())->method('updatePortfolioTags');

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $otherVendorId = Uuid::fromString('01930000-0000-7000-8000-000000000099');

        $response = (new PatchVendorDashboardPortfolioTagsAction($security, $vendorOwnershipResolver, $portfolioImageRepository, $portfolioService, $em))
            ->__invoke($otherVendorId->toRfc4122(), 'image-id', new PatchPortfolioTagsRequestDto());

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Accès interdit.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }
}
