<?php

declare(strict_types=1);

namespace App\Tests\Unit\Assembler\Couple\Pin;

use App\Assembler\Couple\Pin\CouplePinResponseDtoAssembler;
use App\Entity\Couple\Couple;
use App\Entity\Couple\CouplePin;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\PriceType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class CouplePinResponseDtoAssemblerTest extends TestCase
{
    private CouplePinResponseDtoAssembler $assembler;

    protected function setUp(): void
    {
        $this->assembler = new CouplePinResponseDtoAssembler();
    }

    public function test_it_projects_only_the_image_url_and_pin_metadata(): void
    {
        $pin = $this->pin();

        $dto = $this->assembler->assemble($pin);

        $json = json_encode($dto, JSON_THROW_ON_ERROR);
        self::assertSame('https://cdn.wedly.test/coup-de-coeur.jpg', $dto->photoUrl);
        self::assertStringNotContainsString('Studio Lumière', $json);
        self::assertStringNotContainsString('contact@studio-lumiere.test', $json);
        self::assertStringNotContainsString('0600000000', $json);
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

        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://cdn.wedly.test/coup-de-coeur.jpg')
            ->setSortOrder(0);

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
