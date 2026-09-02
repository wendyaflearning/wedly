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
    private const IMAGE_ID = '0198a1c0-0000-7000-8000-000000000001';

    private const VENDOR_ID = '0198a1c0-0000-7000-8000-0000000000bb';

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

        $this->assertSame(self::IMAGE_ID, $dto->id);
        $this->assertSame('https://cdn/1.jpg', $dto->url);
        $this->assertSame(
            [
                'Sous-style' => ['Bohème', 'Champêtre'],
                'Ambiance'   => ['Intimiste'],
            ],
            $dto->tagsByGroup,
        );
    }

    /**
     * Le contrat public s'ouvre à `vendorId` (PROVIDER-LEAD-009) et à rien
     * d'autre : la liste de clés est exhaustive, donc tout champ ajouté au DTO
     * casse ce test avant d'atteindre la galerie publique. C'est le garde-fou —
     * l'identifiant est un choix, une marque ou une bio qui suivrait ne le
     * serait pas.
     */
    public function test_it_exposes_only_id_url_tags_and_the_vendor_correlation_id(): void
    {
        $dto = new PublicPortfolioImageResponseDto($this->image([]));

        $encoded = json_decode(json_encode($dto, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame(['id', 'url', 'tagsByGroup', 'vendorId'], array_keys($encoded));
        $this->assertSame(self::VENDOR_ID, $encoded['vendorId']);
        $this->assertStringNotContainsString('Studio Lumiere', json_encode($dto, JSON_THROW_ON_ERROR));
    }

    /** @param TagValue[] $tags */
    private function image(array $tags): PortfolioImage
    {
        $vendor = (new Vendor())->setBrandName('Studio Lumiere');

        // Le DTO lit désormais l'id du prestataire : sans valeur posée, la
        // propriété typée n'est pas initialisée et la construction échoue.
        $vendorId = new \ReflectionProperty(Vendor::class, 'id');
        $vendorId->setValue($vendor, UuidV7::fromString(self::VENDOR_ID));

        $image = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn/1.jpg')
            ->setSortOrder(0);

        $reflection = new \ReflectionProperty(PortfolioImage::class, 'id');
        $reflection->setValue($image, UuidV7::fromString(self::IMAGE_ID));

        foreach ($tags as $tag) {
            $image->addTag($tag);
        }

        return $image;
    }
}
