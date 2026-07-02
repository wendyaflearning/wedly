<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Region\Region;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorType;
use App\Enum\Vendor\VenueType;
use App\Handler\Vendor\Onboarding\ZonesPricingStepHandler;
use App\Repository\Region\RegionRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ZonesPricingStepHandlerTest extends TestCase
{
    public function test_supports_zones_pricing_step(): void
    {
        $handler = $this->makeHandler($this->createStub(RegionRepository::class));

        $this->assertSame(OnboardingStep::ZonesPricing, $handler->supports());
    }

    public function test_handle_updates_freelance_pricing_and_zones(): void
    {
        $region = $this->regionWithId('Bretagne');

        $repository = $this->createMock(RegionRepository::class);
        $repository->expects($this->once())
            ->method('find')
            ->with('region-1')
            ->willReturn($region);

        $vendor = $this->vendorWithService('photographe', VendorType::Freelance);

        $this->makeHandler($repository)->handle($vendor, [
            'price_min'  => 120000,
            'price_max'  => 250000,
            'price_type' => 'per_service',
            'zones'      => ['region-1'],
        ]);

        $this->assertSame(120000, $vendor->getPriceMinCents());
        $this->assertSame(250000, $vendor->getPriceMaxCents());
        $this->assertSame(PriceType::PerService, $vendor->getPriceType());
        $this->assertSame([$region], $vendor->getRegions()->toArray());
    }

    public function test_handle_updates_venue_city_and_nearest_city_details(): void
    {
        $region = $this->regionWithId('Occitanie');
        $venueDetails = (new VendorVenueDetails())
            ->setVenueType(VenueType::Domaine);

        $repository = $this->createMock(RegionRepository::class);
        $repository->expects($this->once())->method('find')->with('region-1')->willReturn($region);

        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu);
        $vendor->setVenueDetails($venueDetails);

        $this->makeHandler($repository)->handle($vendor, [
            'price_min'                => 300000,
            'price_max'                => 900000,
            'price_type'               => 'per_service',
            'zones'                    => ['region-1'],
            'city'                     => 'Toulouse',
            'nearest_city'             => 'Albi',
            'distance_to_city_minutes' => 45,
        ]);

        $this->assertSame('Toulouse', $vendor->getCity());
        $this->assertSame('Albi', $venueDetails->getNearestCity());
        $this->assertSame(45, $venueDetails->getDistanceToCityMinutes());
    }

    public function test_handle_updates_creator_city_pricing_and_zone(): void
    {
        $region = $this->regionWithId('Ile-de-France');

        $repository = $this->createMock(RegionRepository::class);
        $repository->expects($this->once())->method('find')->with('region-1')->willReturn($region);

        $vendor = $this->vendorWithService('createurs', VendorType::Createurs);

        $this->makeHandler($repository)->handle($vendor, [
            'price_min'  => 50000,
            'price_max'  => 120000,
            'price_type' => 'per_service',
            'zones'      => ['region-1'],
            'city'       => 'Paris',
        ]);

        $this->assertSame('Paris', $vendor->getCity());
        $this->assertSame(50000, $vendor->getPriceMinCents());
        $this->assertSame([$region], $vendor->getRegions()->toArray());
    }

    public function test_handle_throws_when_venue_details_are_missing_for_venue_pricing(): void
    {
        $repository = $this->createMock(RegionRepository::class);
        $repository->expects($this->once())
            ->method('find')
            ->with('region-1')
            ->willReturn($this->regionWithId('Normandie'));

        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage("L'étape caractéristiques du lieu doit être complétée avant zones et tarifs.");

        $this->makeHandler($repository)->handle($vendor, [
            'price_min'                => 300000,
            'price_max'                => 900000,
            'price_type'               => 'per_service',
            'zones'                    => ['region-1'],
            'city'                     => 'Caen',
            'nearest_city'             => 'Bayeux',
            'distance_to_city_minutes' => 30,
        ]);
    }

    public function test_handle_throws_when_region_cannot_be_found(): void
    {
        $repository = $this->createMock(RegionRepository::class);
        $repository->expects($this->once())->method('find')->with('missing-region')->willReturn(null);

        $vendor = $this->vendorWithService('photographe', VendorType::Freelance);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Région introuvable : missing-region');

        $this->makeHandler($repository)->handle($vendor, [
            'price_min'  => 120000,
            'price_max'  => 250000,
            'price_type' => 'per_service',
            'zones'      => ['missing-region'],
        ]);
    }

    public function test_get_step_data_returns_empty_array_until_regions_exist(): void
    {
        $result = $this->makeHandler($this->createStub(RegionRepository::class))->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_get_step_data_returns_creator_city_when_vendor_is_creator(): void
    {
        $region = $this->regionWithId('Nouvelle-Aquitaine');
        $vendor = $this->vendorWithService('createurs', VendorType::Createurs)
            ->setPriceMinCents(80000)
            ->setPriceMaxCents(180000)
            ->setPriceType(PriceType::PerService)
            ->setCity('Bordeaux');
        $vendor->syncZones([$region]);

        $result = $this->makeHandler($this->createStub(RegionRepository::class))->getStepData($vendor);

        $this->assertSame(80000, $result['price_min']);
        $this->assertSame(180000, $result['price_max']);
        $this->assertSame('per_service', $result['price_type']);
        $this->assertSame('Bordeaux', $result['city']);
        $this->assertCount(1, $result['zones']);
        $this->assertIsString($result['zones'][0]);
    }

    public function test_get_step_data_returns_venue_location_details(): void
    {
        $region = $this->regionWithId('Ile-de-France');
        $venueDetails = (new VendorVenueDetails())
            ->setVenueType(VenueType::Chateau)
            ->setNearestCity('Paris')
            ->setDistanceToCityMinutes(35);

        $vendor = $this->vendorWithService('lieu-de-reception', VendorType::Lieu)
            ->setPriceMinCents(500000)
            ->setPriceMaxCents(1200000)
            ->setPriceType(PriceType::PerService)
            ->setCity('Versailles')
            ->setVenueDetails($venueDetails);
        $vendor->syncZones([$region]);

        $result = $this->makeHandler($this->createStub(RegionRepository::class))->getStepData($vendor);

        $this->assertSame('Versailles', $result['city']);
        $this->assertSame('Paris', $result['nearest_city']);
        $this->assertSame(35, $result['distance_to_city_minutes']);
    }

    private function makeHandler(RegionRepository $regionRepository): ZonesPricingStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new ZonesPricingStepHandler($regionRepository, $validator);
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

    private function regionWithId(string $name): Region
    {
        $region = (new Region())
            ->setName($name)
            ->setSlug(strtolower(str_replace(' ', '-', $name)));

        $id = new \ReflectionProperty(Region::class, 'id');
        $id->setValue($region, new UuidV7());

        return $region;
    }
}
