<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Enum\Vendor\VenueType;
use App\Handler\Vendor\Onboarding\VenueCharacteristicsStepHandler;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class VenueCharacteristicsStepHandlerTest extends TestCase
{
    public function test_supports_only_venue_vendor_type(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::VenueCharacteristics, $handler->supports());
        $this->assertTrue($handler->supportsVendorType(VendorType::Lieu));
        $this->assertFalse($handler->supportsVendorType(VendorType::Traiteur));
        $this->assertFalse($handler->supportsVendorType(VendorType::Freelance));
    }

    public function test_handle_creates_venue_details_and_persists_them(): void
    {
        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (VendorVenueDetails $details) use ($vendor): bool {
                return $details->getVendor() === $vendor
                    && $details->getVenueType() === VenueType::Chateau
                    && $details->getCapacityMin() === 80
                    && $details->getCapacityMax() === 180
                    && $details->isHasCatering() === true
                    && $details->isHasAccommodation() === false
                    && $details->isHasOutdoorSpace() === true
                    && $details->isHasCorkageFee() === false
                    && $details->isHasToilets() === true
                    && $details->isIsPmrAccessible() === true
                    && $details->getNearestCity() === 'Tours'
                    && $details->getDistanceToCityMinutes() === 25;
            }));

        $this->makeHandler($em)->handle($vendor, [
            'venue_type'               => 'chateau',
            'capacity_min'             => 80,
            'capacity_max'             => 180,
            'has_catering'             => true,
            'has_accommodation'        => false,
            'has_outdoor_space'        => true,
            'has_corkage_fee'          => false,
            'has_toilets'              => true,
            'is_pmr_accessible'        => true,
            'nearest_city'             => 'Tours',
            'distance_to_city_minutes' => 25,
        ]);
    }

    public function test_handle_updates_existing_venue_details_without_persisting(): void
    {
        $details = (new VendorVenueDetails())
            ->setVenueType(VenueType::Domaine)
            ->setCapacityMin(50)
            ->setCapacityMax(120)
            ->setHasCatering(false);

        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu);
        $vendor->setVenueDetails($details);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('persist');

        $this->makeHandler($em)->handle($vendor, [
            'capacity_min'  => 70,
            'capacity_max'  => 160,
            'has_catering'  => true,
            'venue_type'    => 'loft',
            'nearest_city'  => 'Lyon',
            'distance_to_city_minutes' => 15,
        ]);

        $this->assertSame(VenueType::Loft, $details->getVenueType());
        $this->assertSame(70, $details->getCapacityMin());
        $this->assertSame(160, $details->getCapacityMax());
        $this->assertTrue($details->isHasCatering());
        $this->assertSame('Lyon', $details->getNearestCity());
        $this->assertSame(15, $details->getDistanceToCityMinutes());
    }

    public function test_handle_requires_venue_type_when_creating_details(): void
    {
        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Le champ venue_type est requis à la création.');

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'capacity_min' => 80,
        ]);
    }

    public function test_handle_rejects_vendor_without_venue_service(): void
    {
        $vendor = $this->vendorWithService('photographe', VendorType::Freelance);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Cette étape est réservée aux lieux de réception.');

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'venue_type' => 'chateau',
        ]);
    }

    public function test_get_step_data_returns_empty_array_until_details_exist(): void
    {
        $result = $this->makeHandler($this->createStub(EntityManagerInterface::class))
            ->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_get_step_data_returns_venue_details_payload(): void
    {
        $details = (new VendorVenueDetails())
            ->setVenueType(VenueType::Domaine)
            ->setCapacityMin(90)
            ->setCapacityMax(220)
            ->setHasCatering(true)
            ->setHasAccommodation(true)
            ->setHasOutdoorSpace(false)
            ->setHasCorkageFee(false)
            ->setHasToilets(true)
            ->setIsPmrAccessible(true);

        $vendor = new Vendor();
        $vendor->setVenueDetails($details);

        $result = $this->makeHandler($this->createStub(EntityManagerInterface::class))->getStepData($vendor);

        $this->assertSame([
            'venue_type'        => 'domaine',
            'capacity_min'      => 90,
            'capacity_max'      => 220,
            'has_catering'      => true,
            'has_accommodation' => true,
            'has_outdoor_space' => false,
            'has_corkage_fee'   => false,
            'has_toilets'       => true,
            'is_pmr_accessible' => true,
            'distance_to_city_minutes' => null,
            'nearest_city'      => null,
        ], $result);
    }

    private function makeHandler(EntityManagerInterface $em): VenueCharacteristicsStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new VenueCharacteristicsStepHandler($em, $validator);
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
