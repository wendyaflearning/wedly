<?php

declare(strict_types=1);

namespace App\Tests\Unit\Assembler\Couple\ProviderLead;

use App\Assembler\Couple\ProviderLead\CoupleProviderLeadResponseDtoAssembler;
use App\DTO\Couple\ProviderLead\MaskedProviderLeadResponseDto;
use App\DTO\Couple\ProviderLead\UnlockedProviderLeadResponseDto;
use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Region\Region;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorType;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class CoupleProviderLeadResponseDtoAssemblerTest extends TestCase
{
    private CoupleProviderLeadResponseDtoAssembler $assembler;

    protected function setUp(): void
    {
        $this->assembler = new CoupleProviderLeadResponseDtoAssembler(new ProviderLeadCategoryResolver());
    }

    /**
     * Le cœur du ticket : tant que le prestataire n'a pas accepté, rien de ce
     * qui l'identifie ne sort de l'API. La vérification porte sur la sérialisation
     * complète, pas sur quelques champs choisis : c'est le seul niveau où une
     * fuite ajoutée plus tard serait attrapée.
     */
    public function testAPendingLeadLeaksNothingThatIdentifiesTheVendor(): void
    {
        $lead = $this->lead(ProviderLeadStatus::Pending);

        $dto = $this->assembler->assemble($lead);

        self::assertInstanceOf(MaskedProviderLeadResponseDto::class, $dto);

        $json = json_encode($dto, JSON_THROW_ON_ERROR);
        self::assertStringNotContainsString('Studio Lumière', $json);
        self::assertStringNotContainsString('contact@studio-lumiere.test', $json);
        self::assertStringNotContainsString('0600000000', $json);
        self::assertStringNotContainsString('12 rue des Lilas', $json);
    }

    public function testAPendingLeadStillShowsCategoryZoneAndCrushPhoto(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Pending));

        self::assertInstanceOf(MaskedProviderLeadResponseDto::class, $dto);
        self::assertSame('EN_ATTENTE', $dto->status);
        self::assertSame('Photographe', $dto->category);
        self::assertSame(['Occitanie'], $dto->zones);
        self::assertSame('https://cdn.wedly.test/coup-de-coeur.jpg', $dto->photoUrl);
    }

    /**
     * Un refus ne rend pas la fiche lisible : c'est la seule différence
     * fonctionnelle avec `EN_ATTENTE`, et elle porte sur le libellé, pas sur
     * ce qui est révélé.
     */
    public function testARefusedLeadStaysMasked(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Refused));

        self::assertInstanceOf(MaskedProviderLeadResponseDto::class, $dto);
        self::assertSame('REFUSEE', $dto->status);
    }

    public function testAnAcceptedLeadRevealsTheProfileAndTheContactDetails(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Accepted));

        self::assertInstanceOf(UnlockedProviderLeadResponseDto::class, $dto);
        self::assertSame('DEBLOQUEE', $dto->status);
        self::assertSame('Studio Lumière', $dto->vendor['brandName']);
        self::assertSame('contact@studio-lumiere.test', $dto->vendor['contact']['email']);
        self::assertSame('0600000000', $dto->vendor['contact']['phone']);
        self::assertSame('12 rue des Lilas', $dto->vendor['contact']['address']);
    }

    public function testALeadWithoutACrushPhotoHasNoPhotoUrl(): void
    {
        $lead = $this->persisted(new ProviderLead(new Couple(), $this->vendor(), 250_000));
        $lead->setStatus(ProviderLeadStatus::Pending);

        $dto = $this->assembler->assemble($lead);

        self::assertInstanceOf(MaskedProviderLeadResponseDto::class, $dto);
        self::assertNull($dto->photoUrl);
    }

    private function lead(ProviderLeadStatus $status): ProviderLead
    {
        $vendor = $this->vendor();
        $lead   = $this->persisted(new ProviderLead(new Couple(), $vendor, 250_000, $this->crushPhoto($vendor)));

        return $lead->setStatus($status);
    }

    /**
     * L'identifiant et l'horodatage sont posés par Doctrine au flush. Un test
     * unitaire ne passe pas par là : on les renseigne ici pour rester au niveau
     * de l'assembler, qui est ce qu'on teste.
     */
    private function persisted(ProviderLead $lead): ProviderLead
    {
        $reflection = new \ReflectionClass($lead);
        $reflection->getProperty('id')->setValue($lead, UuidV7::fromString('0198f0a1-0000-7000-8000-000000000001'));
        $reflection->getProperty('createdAt')->setValue($lead, new \DateTimeImmutable('2026-08-28T09:00:00+00:00'));

        return $lead;
    }

    private function vendor(): Vendor
    {
        $user = (new User())->setEmail('contact@studio-lumiere.test');

        $region = (new Region())->setName('Occitanie');

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Lumière')
            ->setPhone('0600000000')
            ->setAddress('12 rue des Lilas')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100_000)
            ->setPriceMaxCents(500_000)
            ->addRegion($region);

        (new \ReflectionClass($vendor))
            ->getProperty('id')
            ->setValue($vendor, UuidV7::fromString('0198f0a1-0000-7000-8000-0000000000f0'));

        return $vendor;
    }

    private function crushPhoto(Vendor $vendor): PortfolioImage
    {
        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(0)
            ->setCategory(VendorType::Freelance);

        $tagType = (new TagType())->setService($service)->setLabel('Type')->setIsPrimary(true);
        $tag     = (new TagValue())->setTagType($tagType)->setLabel('Reportage');

        return (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/coup-de-coeur.jpg')
            ->setSortOrder(0)
            ->addTag($tag);
    }
}
