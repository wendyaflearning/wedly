<?php

declare(strict_types=1);

namespace App\Tests\Unit\Assembler\Couple\Pin;

use App\Assembler\Couple\Pin\CouplePinResponseDtoAssembler;
use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class CouplePinResponseDtoAssemblerTest extends TestCase
{
    private const VENDOR_ID = '0198f0a1-0000-7000-8000-0000000000aa';

    private const PHOTO_ID = '0198f0a1-1111-7000-8000-0000000000bb';

    private CouplePinResponseDtoAssembler $assembler;

    protected function setUp(): void
    {
        $this->assembler = new CouplePinResponseDtoAssembler();
    }

    public function test_it_projects_pin_metadata_and_correlation_fields_without_vendor_identity(): void
    {
        $pin = $this->pin();

        $dto = $this->assembler->assemble($pin);

        $json = json_encode($dto, JSON_THROW_ON_ERROR);
        self::assertSame($this->cloudinaryUrl(), $dto->photoUrl);
        self::assertSame(self::PHOTO_ID, $dto->portfolioImageId);
        self::assertSame(self::VENDOR_ID, $dto->vendorId);
        self::assertSame(
            [
                'Sous-style' => ['Bohème'],
                'Ambiance'   => ['Intimiste'],
            ],
            $dto->tagsByGroup,
        );
        self::assertStringNotContainsString('Studio Lumière', $json);
        self::assertStringNotContainsString('contact@studio-lumiere.test', $json);
        self::assertStringNotContainsString('0600000000', $json);
    }

    private function cloudinaryUrl(): string
    {
        return sprintf(
            'https://res.cloudinary.com/wedly/image/upload/v1/wedly/vendors/%s/photo.jpg',
            self::VENDOR_ID,
        );
    }

    private function pin(): CouplePin
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.test');

        $couple = (new Couple())->setUser($user);

        $vendorUser = (new User())
            ->setFirstName('Sacha')
            ->setEmail('contact@studio-lumiere.test');

        $vendor = (new Vendor())
            ->setUser($vendorUser)
            ->setBrandName('Studio Lumière')
            ->setPhone('0600000000')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100_000)
            ->setPriceMaxCents(500_000);

        $id = new \ReflectionProperty(Vendor::class, 'id');
        $id->setValue($vendor, UuidV7::fromString(self::VENDOR_ID));

        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl($this->cloudinaryUrl())
            ->setSortOrder(0);

        $sousStyle = (new TagType())->setLabel('Sous-style');
        $ambiance  = (new TagType())->setLabel('Ambiance');
        $photo->addTag((new TagValue())->setLabel('Bohème')->setTagType($sousStyle));
        $photo->addTag((new TagValue())->setLabel('Intimiste')->setTagType($ambiance));

        $photoId = new \ReflectionProperty(PortfolioImage::class, 'id');
        $photoId->setValue($photo, UuidV7::fromString(self::PHOTO_ID));

        $pin = new CouplePin($couple, $photo);

        $reflection = new \ReflectionProperty(CouplePin::class, 'id');
        $reflection->setValue($pin, UuidV7::v7());

        $createdAt = new \ReflectionProperty(CouplePin::class, 'createdAt');
        $createdAt->setValue($pin, new \DateTimeImmutable('2026-08-28T10:00:00+00:00'));

        $updatedAt = new \ReflectionProperty(CouplePin::class, 'updatedAt');
        $updatedAt->setValue($pin, new \DateTimeImmutable('2026-08-28T10:00:00+00:00'));

        return $pin;
    }
}
