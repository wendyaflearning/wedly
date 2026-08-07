<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Admin\Vendor\Portfolio;

use App\DTO\Admin\Vendor\Portfolio\PortfolioMappingTrait;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use Doctrine\Common\Collections\ArrayCollection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;

final class PortfolioMappingTraitTest extends TestCase
{
    public function test_portfolio_maps_image_tags_under_tags_key(): void
    {
        $tag = new TagValue();
        $tag->setLabel('Bohème');
        $tagId = Uuid::fromString('01930000-0000-7000-8000-000000000003');
        $tagIdReflection = new \ReflectionProperty(TagValue::class, 'id');
        $tagIdReflection->setAccessible(true);
        $tagIdReflection->setValue($tag, $tagId);

        $image = (new PortfolioImage())
            ->setUrl('https://res.cloudinary.com/img.jpg')
            ->setSortOrder(1)
            ->setIsCover(true)
            ->addTag($tag);
        $imageId = Uuid::fromString('01930000-0000-7000-8000-000000000002');
        $imageIdReflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $imageIdReflection->setAccessible(true);
        $imageIdReflection->setValue($image, $imageId);

        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getPortfolioImages')->willReturn(new ArrayCollection([$image]));

        $harness = new class {
            use PortfolioMappingTrait {
                portfolio as public;
            }
        };

        $result = $harness->portfolio($vendor);

        $this->assertCount(1, $result);
        $this->assertArrayNotHasKey('styles', $result[0]);
        $this->assertArrayNotHasKey('specialties', $result[0]);
        $this->assertCount(1, $result[0]['tags']);
        $this->assertSame($tagId->toRfc4122(), $result[0]['tags'][0]->id);
        $this->assertSame('Bohème', $result[0]['tags'][0]->label);
    }

    public function test_portfolio_returns_empty_array_when_vendor_has_no_photos(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getPortfolioImages')->willReturn(new ArrayCollection([]));

        $harness = new class {
            use PortfolioMappingTrait {
                portfolio as public;
            }
        };

        $this->assertSame([], $harness->portfolio($vendor));
    }
}
