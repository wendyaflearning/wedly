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
use App\Service\ProviderLead\ProviderLeadSpecialtyTagsResolver;
use PHPUnit\Framework\TestCase;

final class ProviderLeadSpecialtyTagsResolverTest extends TestCase
{
    private ProviderLeadSpecialtyTagsResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new ProviderLeadSpecialtyTagsResolver();
    }

    public function testItReadsTheNonPrimaryTagsOfTheCrushPhoto(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [
            $this->tag('Bohème', isPrimary: false),
            $this->tag('Champêtre', isPrimary: false),
        ]);

        self::assertSame(
            ['Bohème', 'Champêtre'],
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo)),
        );
    }

    /**
     * Le tag primaire porte le métier — c'est la catégorie, que
     * `ProviderLeadCategoryResolver` résout déjà. Le répéter dans les
     * spécialités ferait lire « Photographe » deux fois au prestataire.
     */
    public function testItIgnoresPrimaryTags(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [
            $this->tag('Photographe', isPrimary: true),
            $this->tag('Bohème', isPrimary: false),
        ]);

        self::assertSame(
            ['Bohème'],
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo)),
        );
    }

    public function testAPhotoCarryingOnlyPrimaryTagsHasNoSpecialty(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [$this->tag('Photographe', isPrimary: true)]);

        self::assertSame([], $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo)));
    }

    /**
     * Deux TagType non primaires distincts peuvent porter le même label —
     * « Bohème » en Univers et en Style. Le prestataire ne doit pas le lire deux
     * fois.
     */
    public function testItDeduplicatesLabelsSharedByTwoTagTypes(): void
    {
        $vendor = new Vendor();
        $photo  = $this->photoOf($vendor, [
            $this->tag('Bohème', isPrimary: false),
            $this->tag('Bohème', isPrimary: false),
        ]);

        self::assertSame(['Bohème'], $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 250_000, $photo)));
    }

    /**
     * L'ordre d'insertion des tags ne doit pas décider de ce qu'affiche un email
     * déjà parti : même photo taguée dans deux sens, même liste.
     */
    public function testTheOrderDoesNotDependOnHowTheTagsWereAdded(): void
    {
        $vendor = new Vendor();

        $oneWay   = $this->photoOf($vendor, [$this->tag('Champêtre', false), $this->tag('Bohème', false)]);
        $otherWay = $this->photoOf($vendor, [$this->tag('Bohème', false), $this->tag('Champêtre', false)]);

        self::assertSame(
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 1, $oneWay)),
            $this->resolver->resolve(new ProviderLead(new Couple(), $vendor, 1, $otherWay)),
        );
    }

    /**
     * Lead créé avant WED-131, ou demande partie d'ailleurs que de la galerie.
     * Contrairement à la catégorie, aucun repli sur le prestataire : ses tags
     * décrivent l'ensemble de son portfolio, pas la demande.
     */
    public function testWithoutAPhotoThereIsNoSpecialty(): void
    {
        self::assertSame([], $this->resolver->resolve(new ProviderLead(new Couple(), new Vendor(), 250_000)));
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

    private function tag(string $label, bool $isPrimary): TagValue
    {
        $tagType = (new TagType())
            ->setService($this->service())
            ->setLabel('Type')
            ->setIsPrimary($isPrimary);

        return (new TagValue())->setTagType($tagType)->setLabel($label);
    }

    private function service(): Service
    {
        return (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(0)
            ->setCategory(VendorType::Freelance);
    }
}
