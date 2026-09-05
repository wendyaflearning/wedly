<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Vendor\Portfolio;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorType;
use App\Service\Vendor\Portfolio\PortfolioImageCategoryResolver;
use PHPUnit\Framework\TestCase;

final class PortfolioImageCategoryResolverTest extends TestCase
{
    private PortfolioImageCategoryResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new PortfolioImageCategoryResolver();
    }

    public function testItReadsTheCategoryFromThePrimaryTag(): void
    {
        $photo = $this->photoOf([$this->tag($this->service('Photographe', 'photographe'), isPrimary: true)]);

        $category = $this->resolver->resolve($photo);

        self::assertNotNull($category);
        self::assertSame('Photographe', $category->getName());
    }

    /**
     * Un tag secondaire décrit le style de la photo, pas le métier : le lire
     * afficherait « Bohème » là où on attend « Lieu de réception ».
     */
    public function testItIgnoresNonPrimaryTags(): void
    {
        $photo = $this->photoOf([$this->tag($this->service('Ambiance', 'ambiance'), isPrimary: false)]);

        self::assertNull($this->resolver->resolve($photo));
    }

    /**
     * Le métier affiché est la racine, pas le sous-service tagué sur la photo.
     */
    public function testItClimbsToTheRootService(): void
    {
        $root  = $this->service('Lieu de réception', 'lieu-de-reception');
        $child = $this->service('Château', 'chateau')->setParent($root);
        $photo = $this->photoOf([$this->tag($child, isPrimary: true)]);

        self::assertSame($root, $this->resolver->resolve($photo));
    }

    /**
     * Rien n'empêche formellement deux tags primaires de services différents :
     * le choix doit être le même à chaque lecture, pas celui du hasard.
     */
    public function testItPicksTheSameServiceOnEveryReadWhenAPhotoCarriesTwo(): void
    {
        $first  = $this->service('Traiteur', 'traiteur')->setSortOrder(1);
        $second = $this->service('Photographe', 'photographe')->setSortOrder(5);

        $oneWay   = $this->photoOf([$this->tag($second, true), $this->tag($first, true)]);
        $otherWay = $this->photoOf([$this->tag($first, true), $this->tag($second, true)]);

        self::assertSame(
            $this->resolver->resolve($oneWay)?->getName(),
            $this->resolver->resolve($otherWay)?->getName(),
        );
        self::assertSame('Traiteur', $this->resolver->resolve($oneWay)?->getName());
    }

    public function testWithoutAnyTagThereIsNoCategory(): void
    {
        self::assertNull($this->resolver->resolve($this->photoOf([])));
    }

    /**
     * @param TagValue[] $tags
     */
    private function photoOf(array $tags): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor(new Vendor())
            ->setUrl('https://cdn.wedly.test/photo.jpg')
            ->setSortOrder(0);

        foreach ($tags as $tag) {
            $photo->addTag($tag);
        }

        return $photo;
    }

    private function tag(Service $service, bool $isPrimary): TagValue
    {
        $tagType = (new TagType())
            ->setService($service)
            ->setLabel('Type')
            ->setIsPrimary($isPrimary);

        return (new TagValue())->setTagType($tagType)->setLabel('Valeur');
    }

    private function service(string $name, string $slug): Service
    {
        return (new Service())
            ->setName($name)
            ->setSlug($slug)
            ->setSortOrder(0)
            ->setCategory(VendorType::Freelance);
    }
}
