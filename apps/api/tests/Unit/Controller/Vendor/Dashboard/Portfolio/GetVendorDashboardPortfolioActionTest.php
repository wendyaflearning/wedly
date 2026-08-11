<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor\Dashboard\Portfolio;

use App\Controller\Vendor\Dashboard\Portfolio\GetVendorDashboardPortfolioAction;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\Vendor\VendorOwnershipResolver;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;

final class GetVendorDashboardPortfolioActionTest extends TestCase
{
    public function test_invoke_returns_403_when_id_does_not_match_resolved_vendor(): void
    {
        $resolvedVendorId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $vendor           = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn($resolvedVendorId);

        $user = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->never())->method('findByVendor');

        $otherVendorId = Uuid::fromString('01930000-0000-7000-8000-000000000099');

        $response = (new GetVendorDashboardPortfolioAction($security, $vendorOwnershipResolver, $portfolioImageRepository))
            ->__invoke($otherVendorId->toRfc4122());

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Accès interdit.'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }

    public function test_invoke_returns_200_with_flat_tags_array_per_image(): void
    {
        $vendorId = Uuid::fromString('01930000-0000-7000-8000-000000000001');
        $vendor   = $this->createStub(Vendor::class);
        $vendor->method('getId')->willReturn($vendorId);

        $user = $this->createStub(User::class);

        $security = $this->createMock(Security::class);
        $security->expects($this->once())->method('getUser')->willReturn($user);

        $vendorOwnershipResolver = $this->createMock(VendorOwnershipResolver::class);
        $vendorOwnershipResolver->expects($this->once())->method('resolve')->with($user)->willReturn($vendor);

        $tagValueId = Uuid::fromString('01930000-0000-7000-8000-000000000010');
        $tagValue   = $this->createStub(TagValue::class);
        $tagValue->method('getId')->willReturn($tagValueId);
        $tagValue->method('getLabel')->willReturn('Bohème');

        $taggedImageId = Uuid::fromString('01930000-0000-7000-8000-000000000002');
        $taggedImage   = (new PortfolioImage())
            ->setUrl('https://res.cloudinary.com/tagged.jpg')
            ->setIsCover(true)
            ->setSortOrder(0)
            ->setVisibleInWedream(true)
            ->addTag($tagValue);
        $taggedImageIdProperty = new \ReflectionProperty(PortfolioImage::class, 'id');
        $taggedImageIdProperty->setAccessible(true);
        $taggedImageIdProperty->setValue($taggedImage, $taggedImageId);

        $untaggedImageId = Uuid::fromString('01930000-0000-7000-8000-000000000003');
        $untaggedImage   = (new PortfolioImage())
            ->setUrl('https://res.cloudinary.com/untagged.jpg')
            ->setIsCover(false)
            ->setSortOrder(1)
            ->setVisibleInWedream(false);
        $untaggedImageIdProperty = new \ReflectionProperty(PortfolioImage::class, 'id');
        $untaggedImageIdProperty->setAccessible(true);
        $untaggedImageIdProperty->setValue($untaggedImage, $untaggedImageId);

        $portfolioImageRepository = $this->createMock(PortfolioImageRepository::class);
        $portfolioImageRepository->expects($this->once())
            ->method('findByVendor')
            ->with($vendor)
            ->willReturn([$taggedImage, $untaggedImage]);

        $response = (new GetVendorDashboardPortfolioAction($security, $vendorOwnershipResolver, $portfolioImageRepository))
            ->__invoke($vendorId->toRfc4122());

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            [
                [
                    'id'                    => $taggedImageId->toRfc4122(),
                    'url'                   => 'https://res.cloudinary.com/tagged.jpg',
                    'is_cover'              => true,
                    'sort_order'            => 0,
                    'is_visible_in_wedream' => true,
                    'tags'                  => [
                        ['id' => $tagValueId->toRfc4122(), 'label' => 'Bohème'],
                    ],
                ],
                [
                    'id'                    => $untaggedImageId->toRfc4122(),
                    'url'                   => 'https://res.cloudinary.com/untagged.jpg',
                    'is_cover'              => false,
                    'sort_order'            => 1,
                    'is_visible_in_wedream' => false,
                    'tags'                  => [],
                ],
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR),
        );
    }
}
