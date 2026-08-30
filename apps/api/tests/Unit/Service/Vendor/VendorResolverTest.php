<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service\Vendor;

use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\PortfolioImageRepository;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorResolver;
use PHPUnit\Framework\TestCase;

/**
 * WED-153 : ces règles vivaient dans CoupleRegistrationService (WED-150). Elles
 * sont désormais testées pour elles-mêmes, sur le service réel — seuls les deux
 * repositories sont doublés — parce que US3b et US3c s'appuieront dessus sans
 * passer par le parcours d'inscription.
 */
final class VendorResolverTest extends TestCase
{
    private const VENDOR_ID = '0198f1c2-0000-7000-8000-000000000000';
    private const PHOTO_ID = '0198f1c2-0000-7000-8000-000000000001';
    private const UNKNOWN_ID = '0198f1c2-0000-7000-8000-00000000000f';

    public function test_it_resolves_an_active_vendor_from_its_id(): void
    {
        $vendor = $this->makeVendor();

        self::assertSame(
            $vendor,
            $this->makeResolver(vendorsById: [self::VENDOR_ID => $vendor])
                ->resolveActive(self::VENDOR_ID, null),
        );
    }

    /**
     * WED-150 : le parcours cible en réalité une photo. Sans `vendorId`, le
     * serveur remonte au propriétaire de celle-ci — le couple n'a jamais eu à
     * connaître son identifiant.
     */
    public function test_it_resolves_the_vendor_from_the_crush_photo(): void
    {
        $vendor = $this->makeVendor();
        $photo  = $this->makePhoto($vendor);

        self::assertSame(
            $vendor,
            $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
                ->resolveActive(null, self::PHOTO_ID),
        );
    }

    /**
     * Le `vendorId` prime : il est le chemin historique, la photo n'est
     * consultée qu'en son absence.
     */
    public function test_the_vendor_id_wins_over_the_crush_photo(): void
    {
        $vendor      = $this->makeVendor();
        $otherVendor = $this->makeVendor();

        $resolved = $this->makeResolver(
            vendorsById: [self::VENDOR_ID => $vendor],
            imagesById: [self::PHOTO_ID => $this->makePhoto($otherVendor)],
        )->resolveActive(self::VENDOR_ID, self::PHOTO_ID);

        self::assertSame($vendor, $resolved);
    }

    public function test_an_unknown_vendor_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Ce prestataire n\'est pas disponible.');

        $this->makeResolver()->resolveActive(self::UNKNOWN_ID, null);
    }

    public function test_an_inactive_vendor_is_refused(): void
    {
        $vendor = $this->makeVendor(VendorStatus::Pending);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Ce prestataire n\'est pas disponible.');

        $this->makeResolver(vendorsById: [self::VENDOR_ID => $vendor])
            ->resolveActive(self::VENDOR_ID, null);
    }

    /**
     * `isVisibleInWedream` est recalculé au tagging, pas à chaque changement de
     * statut du prestataire : une photo encore taguée visible ne suffit donc pas
     * à rendre son propriétaire joignable.
     */
    public function test_a_visible_photo_of_an_inactive_vendor_is_refused(): void
    {
        $photo = $this->makePhoto($this->makeVendor(VendorStatus::Pending));

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Ce prestataire n\'est pas disponible.');

        $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
            ->resolveActive(null, self::PHOTO_ID);
    }

    /**
     * La contrainte de classe du DTO d'inscription ferme déjà ce cas en amont ;
     * le service refuse quand même, il est aussi appelable sans passer par
     * MapRequestPayload.
     */
    public function test_a_request_targeting_nothing_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette demande de contact ne cible aucun prestataire.');

        $this->makeResolver()->resolveActive(null, null);
    }

    public function test_it_resolves_a_crush_photo_owned_by_the_vendor(): void
    {
        $vendor = $this->makeVendor();
        $photo  = $this->makePhoto($vendor);

        self::assertSame(
            $photo,
            $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
                ->resolveCrushPhoto($vendor, self::PHOTO_ID),
        );
    }

    /**
     * Sinon la carte du couple afficherait le travail d'un tiers.
     */
    public function test_a_crush_photo_from_another_vendor_is_refused(): void
    {
        $photo = $this->makePhoto($this->makeVendor());

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette photo n\'est pas disponible.');

        $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
            ->resolveCrushPhoto($this->makeVendor(), self::PHOTO_ID);
    }

    public function test_an_unknown_crush_photo_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette photo n\'est pas disponible.');

        $this->makeResolver()->resolveCrushPhoto($this->makeVendor(), self::UNKNOWN_ID);
    }

    /**
     * Publiée dans Wedream ou rien : c'est la seule galerie où le couple a pu
     * voir la photo.
     */
    public function test_a_crush_photo_hidden_from_wedream_is_refused(): void
    {
        $vendor = $this->makeVendor();
        $photo  = $this->makePhoto($vendor, visibleInWedream: false);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette photo n\'est pas disponible.');

        $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
            ->resolveCrushPhoto($vendor, self::PHOTO_ID);
    }

    public function test_it_finds_a_photo_published_in_wedream(): void
    {
        $photo = $this->makePhoto($this->makeVendor());

        self::assertSame(
            $photo,
            $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
                ->findVisiblePortfolioImage(self::PHOTO_ID),
        );
    }

    public function test_an_unknown_photo_is_refused(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette photo n\'est pas disponible.');

        $this->makeResolver()->findVisiblePortfolioImage(self::UNKNOWN_ID);
    }

    public function test_a_photo_hidden_from_wedream_is_refused(): void
    {
        $photo = $this->makePhoto($this->makeVendor(), visibleInWedream: false);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette photo n\'est pas disponible.');

        $this->makeResolver(imagesById: [self::PHOTO_ID => $photo])
            ->findVisiblePortfolioImage(self::PHOTO_ID);
    }

    /**
     * @param array<string, Vendor>         $vendorsById
     * @param array<string, PortfolioImage> $imagesById
     */
    private function makeResolver(array $vendorsById = [], array $imagesById = []): VendorResolver
    {
        $vendors = $this->createStub(VendorRepository::class);
        $vendors->method('find')->willReturnCallback(
            static fn(mixed $id): ?Vendor => $vendorsById[(string) $id] ?? null,
        );

        $images = $this->createStub(PortfolioImageRepository::class);
        $images->method('find')->willReturnCallback(
            static fn(mixed $id): ?PortfolioImage => $imagesById[(string) $id] ?? null,
        );

        return new VendorResolver($vendors, $images);
    }

    private function makeVendor(VendorStatus $status = VendorStatus::Active): Vendor
    {
        return (new Vendor())->setStatus($status);
    }

    private function makePhoto(Vendor $vendor, bool $visibleInWedream = true): PortfolioImage
    {
        return (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/crush.jpg')
            ->setSortOrder(0)
            ->setVisibleInWedream($visibleInWedream);
    }
}
