<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Public\PortfolioImage;

use App\DTO\Public\PortfolioImage\PublicPortfolioImageResponseDto;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class PublicPortfolioImageResponseDtoTest extends TestCase
{
    public function test_it_groups_tag_labels_by_tag_type_label(): void
    {
        $sousStyle = (new TagType())->setLabel('Sous-style');
        $ambiance  = (new TagType())->setLabel('Ambiance');

        $image = $this->image([
            (new TagValue())->setLabel('Bohème')->setTagType($sousStyle),
            (new TagValue())->setLabel('Champêtre')->setTagType($sousStyle),
            (new TagValue())->setLabel('Intimiste')->setTagType($ambiance),
        ]);

        $dto = new PublicPortfolioImageResponseDto($image);

        $this->assertSame('0198a1c0-0000-7000-8000-000000000001', $dto->id);
        $this->assertSame('https://cdn/1.jpg', $dto->url);
        $this->assertSame(
            [
                'Sous-style' => ['Bohème', 'Champêtre'],
                'Ambiance'   => ['Intimiste'],
            ],
            $dto->tagsByGroup,
        );
    }

    public function test_it_exposes_only_id_url_and_tags(): void
    {
        $dto = new PublicPortfolioImageResponseDto($this->image([]));

        $encoded = json_decode(json_encode($dto, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(['id', 'url', 'tagsByGroup'], array_keys($encoded));
    }

    /** @param TagValue[] $tags */
    private function image(array $tags): PortfolioImage
    {
        $image = (new PortfolioImage())
            ->setVendor((new Vendor())->setBrandName('Studio Lumiere'))
            ->setUrl('https://cdn/1.jpg')
            ->setSortOrder(0);

        $reflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $reflection->setValue($image, UuidV7::fromString('0198a1c0-0000-7000-8000-000000000001'));

        foreach ($tags as $tag) {
            $image->addTag($tag);
        }

        return $image;
    }
}
