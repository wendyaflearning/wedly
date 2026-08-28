<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorType;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;
use PHPUnit\Framework\TestCase;

final class ProviderLeadCategoryResolverTest extends TestCase
{
    private ProviderLeadCategoryResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new ProviderLeadCategoryResolver();
    }

    public function testItReadsTheCategoryFromThePrimaryTagOfTheCrushPhoto(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [
            $this->tag($this->service('Photographe', 'photographe'), isPrimary: true),
        ]);

        $category = $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo));

        self::assertNotNull($category);
        self::assertSame('Photographe', $category->getName());
    }

    /**
     * Un tag secondaire décrit le style de la photo, pas le métier : le lire
     * afficherait « Bohème » là où le couple attend « Lieu de réception ».
     */
    public function testItIgnoresNonPrimaryTags(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [
            $this->tag($this->service('Ambiance', 'ambiance'), isPrimary: false),
        ]);

        self::assertNull($this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo)));
    }

    /**
     * La carte affiche le métier, pas le sous-service tagué sur la photo.
     */
    public function testItClimbsToTheRootService(): void
    {
        $vendor = new Vendor();
        $root   = $this->service('Lieu de réception', 'lieu-de-reception');
        $child  = $this->service('Château', 'chateau')->setParent($root);
        $photo  = $this->photoOf($vendor, [$this->tag($child, isPrimary: true)]);

        $category = $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo));

        self::assertSame($root, $category);
    }

    /**
     * Rien n'empêche formellement deux tags primaires de services différents :
     * le choix doit être le même à chaque lecture, pas celui du hasard.
     */
    public function testItPicksTheSameServiceOnEveryReadWhenAPhotoCarriesTwo(): void
    {
        $vendor  = new Vendor();
        $first   = $this->service('Traiteur', 'traiteur')->setSortOrder(1);
        $second  = $this->service('Photographe', 'photographe')->setSortOrder(5);

        $oneWay   = $this->photoOf($vendor, [$this->tag($second, true), $this->tag($first, true)]);
        $otherWay = $this->photoOf($vendor, [$this->tag($first, true), $this->tag($second, true)]);

        self::assertSame(
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 1, $oneWay))?->getName(),
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 1, $otherWay))?->getName(),
        );
        self::assertSame(
            'Traiteur',
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 1, $oneWay))?->getName(),
        );
    }

    /**
     * Leads créés avant WED-131, ou demande partie d'ailleurs que de la galerie.
     */
    public function testWithoutAPhotoItFallsBackToASingleServiceVendor(): void
    {
        $vendor = (new Vendor())->addService($this->service('Fleuriste', 'fleuriste'));

        $category = $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000));

        self::assertNotNull($category);
        self::assertSame('Fleuriste', $category->getName());
    }

    /**
     * Au-delà d'un service, aucune catégorie n'est plus légitime qu'une autre —
     * et `vendor_service` grandit tout seul quand le prestataire tague de
     * nouvelles photos. Mieux vaut ne rien afficher qu'afficher au hasard.
     */
    public function testWithoutAPhotoAMultiServiceVendorYieldsNoCategory(): void
    {
        $vendor = (new Vendor())
            ->addService($this->service('Fleuriste', 'fleuriste'))
            ->addService($this->service('Décorateur', 'decorateur'));

        self::assertNull($this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000)));
    }

    public function testWithoutAPhotoNorServiceThereIsNoCategory(): void
    {
        self::assertNull($this->resolver->resolve(new ProviderLead(new Couple(), new Vendor(), 250_000)));
    }

    /**
     * @param TagValue[] $tags
     */
    private function photoOf(Vendor $vendor, array $tags): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
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
