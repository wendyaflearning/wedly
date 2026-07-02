<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Handler\Vendor\Onboarding\CateringCharacteristicsStepHandler;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CateringCharacteristicsStepHandlerTest extends TestCase
{
    public function test_supports_only_catering_vendor_type(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::CateringCharacteristics, $handler->supports());
        $this->assertTrue($handler->supportsVendorType(VendorType::Traiteur));
        $this->assertFalse($handler->supportsVendorType(VendorType::Lieu));
        $this->assertFalse($handler->supportsVendorType(VendorType::Freelance));
    }

    public function test_handle_creates_catering_details_and_persists_them(): void
    {
        $vendor = $this->vendorWithService('traiteur', VendorType::Traiteur);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (VendorCateringDetails $details) use ($vendor): bool {
                return $details->getVendor() === $vendor
                    && $details->getCoversMin() === 40
                    && $details->getCoversMax() === 180
                    && $details->isKosher() === true
                    && $details->isHalal() === false
                    && $details->isVegan() === true
                    && $details->isGlutenFree() === false
                    && $details->isOffersTableService() === true
                    && $details->isOffersBuffet() === true
                    && $details->isOffersCocktail() === false
                    && $details->isProvidesTableware() === true
                    && $details->isProvidesFurniture() === false;
            }));

        $this->makeHandler($em)->handle($vendor, [
            'covers_min'              => 40,
            'covers_max'              => 180,
            'is_kosher'               => true,
            'is_halal'                => false,
            'is_vegan'                => true,
            'is_gluten_free'          => false,
            'is_offers_table_service' => true,
            'is_offers_buffet'        => true,
            'is_offers_cocktail'      => false,
            'is_provide_tableware'    => true,
            'is_provide_furniture'    => false,
        ]);
    }

    public function test_handle_updates_existing_catering_details_without_persisting(): void
    {
        $details = (new VendorCateringDetails())
            ->setCoversMin(20)
            ->setCoversMax(90)
            ->setIsHalal(false)
            ->setOffersBuffet(false);

        $vendor = $this->vendorWithService('traiteur', VendorType::Traiteur);
        $vendor->setCateringDetails($details);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('persist');

        $this->makeHandler($em)->handle($vendor, [
            'covers_min'       => 30,
            'covers_max'       => 120,
            'is_halal'         => true,
            'is_offers_buffet' => true,
        ]);

        $this->assertSame(30, $details->getCoversMin());
        $this->assertSame(120, $details->getCoversMax());
        $this->assertTrue($details->isHalal());
        $this->assertTrue($details->isOffersBuffet());
    }

    public function test_handle_rejects_vendor_without_catering_service(): void
    {
        $vendor = $this->vendorWithService('photographe', VendorType::Freelance);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette étape est réservée aux traiteurs.');

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'covers_min' => 40,
        ]);
    }

    public function test_get_step_data_returns_empty_array_until_details_exist(): void
    {
        $result = $this->makeHandler($this->createStub(EntityManagerInterface::class))
            ->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_get_step_data_returns_catering_details_payload(): void
    {
        $details = (new VendorCateringDetails())
            ->setCoversMin(50)
            ->setCoversMax(160)
            ->setOffersTableService(true)
            ->setOffersBuffet(false)
            ->setOffersCocktail(true)
            ->setIsKosher(false)
            ->setIsHalal(true)
            ->setIsVegan(true)
            ->setIsGlutenFree(false)
            ->setProvidesTableware(true)
            ->setProvidesFurniture(false);

        $vendor = new Vendor();
        $vendor->setCateringDetails($details);

        $result = $this->makeHandler($this->createStub(EntityManagerInterface::class))->getStepData($vendor);

        $this->assertSame([
            'covers_min'              => 50,
            'covers_max'              => 160,
            'is_offers_table_service' => true,
            'is_offers_buffet'        => false,
            'is_offers_cocktail'      => true,
            'is_kosher'               => false,
            'is_halal'                => true,
            'is_vegan'                => true,
            'is_gluten_free'          => false,
            'is_provide_tableware'    => true,
            'is_provide_furniture'    => false,
        ], $result);
    }

    private function makeHandler(EntityManagerInterface $em): CateringCharacteristicsStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new CateringCharacteristicsStepHandler($em, $validator);
    }

    private function vendorWithService(string $slug, VendorType $category): Vendor
    {
        $service = (new Service())
            ->setName('Service')
            ->setSlug($slug)
            ->setSortOrder(1)
            ->setCategory($category);

        return (new Vendor())->addService($service);
    }
}
