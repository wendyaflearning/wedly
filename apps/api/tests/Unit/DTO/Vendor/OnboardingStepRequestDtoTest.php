<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Vendor;

use App\DTO\Vendor\Step\CateringCharacteristicsRequestDto;
use App\DTO\Vendor\Step\CateringPricingRequestDto;
use App\DTO\Vendor\Step\CreatorPricingRequestDto;
use App\DTO\Vendor\Step\FreelancePricingRequestDto;
use App\DTO\Vendor\Step\PortfolioStepRequestDto;
use App\DTO\Vendor\Step\VenueCharacteristicsRequestDto;
use App\DTO\Vendor\Step\VenuePricingRequestDto;
use App\Enum\Vendor\VenueType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Context\ExecutionContextInterface;
use Symfony\Component\Validator\Violation\ConstraintViolationBuilderInterface;

final class OnboardingStepRequestDtoTest extends TestCase
{
    public function test_pricing_dtos_are_created_from_snake_case_payloads(): void
    {
        $freelance = FreelancePricingRequestDto::fromArray([
            'price_min' => 100,
            'price_max' => 200,
            'price_type' => 'per_service',
            'zones' => ['idf'],
        ]);
        $catering = CateringPricingRequestDto::fromArray([
            'price_min' => 100,
            'price_max' => 200,
            'price_type' => 'per_person',
            'zones' => ['idf'],
        ]);
        $creator = CreatorPricingRequestDto::fromArray([
            'price_min' => 100,
            'price_max' => 200,
            'price_type' => 'per_hour',
            'zones' => ['idf'],
            'city' => 'Paris',
        ]);
        $venue = VenuePricingRequestDto::fromArray([
            'price_min' => 100,
            'price_max' => 200,
            'price_type' => 'per_service',
            'zones' => ['idf'],
            'city' => 'Paris',
            'nearest_city' => 'Versailles',
            'distance_to_city_minutes' => 30,
        ]);

        $this->assertSame(100, $freelance->priceMin);
        $this->assertSame('per_person', $catering->priceType);
        $this->assertSame('Paris', $creator->city);
        $this->assertSame('Versailles', $venue->nearestCity);
    }

    public function test_pricing_dtos_report_invalid_price_ranges(): void
    {
        FreelancePricingRequestDto::fromArray([
            'price_min' => 200,
            'price_max' => 100,
            'price_type' => 'per_service',
            'zones' => ['idf'],
        ])->validatePriceRange($this->expectViolation(
            'price_min doit être inférieur à price_max.',
            'price_min'
        ));
        CreatorPricingRequestDto::fromArray([
            'price_min' => 200,
            'price_max' => 100,
            'price_type' => 'per_service',
            'zones' => ['idf'],
            'city' => 'Paris',
        ])->validatePriceRange($this->expectViolation(
            'price_min doit être inférieur à price_max.',
            'price_min'
        ));
        VenuePricingRequestDto::fromArray([
            'price_min' => 200,
            'price_max' => 100,
            'price_type' => 'per_service',
            'zones' => ['idf'],
            'city' => 'Paris',
            'nearest_city' => 'Versailles',
            'distance_to_city_minutes' => 30,
        ])->validatePriceRange($this->expectViolation(
            'price_min doit être inférieur à price_max.',
            'price_min'
        ));
        CateringPricingRequestDto::fromArray([
            'price_min' => 200,
            'price_max' => 100,
            'price_type' => 'per_service',
            'zones' => ['idf'],
        ])->validatePriceRange($this->expectViolation(
            'price_min doit être inférieur à price_max.',
            'price_min'
        ));
    }

    public function test_venue_characteristics_from_array_maps_enum_and_optional_fields(): void
    {
        $dto = VenueCharacteristicsRequestDto::fromArray([
            'venue_type' => 'chateau',
            'capacity_min' => 80,
            'capacity_max' => 180,
            'has_catering' => true,
            'has_accommodation' => false,
            'has_outdoor_space' => true,
            'has_corkage_fee' => false,
            'has_toilets' => true,
            'is_pmr_accessible' => true,
            'nearest_city' => 'Paris',
            'distance_to_city_minutes' => 30,
        ]);

        $this->assertSame(VenueType::Chateau, $dto->venueType);
        $this->assertSame(80, $dto->capacityMin);
        $this->assertTrue($dto->hasCatering);
        $this->assertSame('Paris', $dto->nearestCity);
    }

    public function test_venue_characteristics_rejects_invalid_venue_type(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Type de lieu invalide : invalid');

        VenueCharacteristicsRequestDto::fromArray(['venue_type' => 'invalid']);
    }

    public function test_venue_characteristics_reports_capacity_and_city_pairing_violations(): void
    {
        VenueCharacteristicsRequestDto::fromArray([
            'capacity_min' => 200,
            'capacity_max' => 100,
        ])->validateCapacityRange($this->expectViolation(
            'capacity_min doit être inférieur à capacity_max.',
            'capacity_min'
        ));
        VenueCharacteristicsRequestDto::fromArray([
            'nearest_city' => 'Paris',
        ])->validateCityFields($this->expectViolation(
            'distance_to_city_minutes est requis si nearest_city est fourni.',
            'distance_to_city_minutes'
        ));
        VenueCharacteristicsRequestDto::fromArray([
            'distance_to_city_minutes' => 30,
        ])->validateCityFields($this->expectViolation(
            'nearest_city est requis si distance_to_city_minutes est fourni.',
            'nearest_city'
        ));
    }

    public function test_catering_characteristics_reports_invalid_covers_range(): void
    {
        $dto = CateringCharacteristicsRequestDto::fromArray([
            'covers_min' => 200,
            'covers_max' => 100,
        ]);

        $dto->validateCovers($this->expectViolation(
            'covers_min doit être inférieur à covers_max',
            'covers_min'
        ));
    }

    public function test_portfolio_request_dto_can_be_created_from_request_and_array(): void
    {
        $cover = $this->createStub(UploadedFile::class);
        $photo = $this->createStub(UploadedFile::class);

        $fromArray = PortfolioStepRequestDto::fromArray([
            'cover_photo' => $cover,
            'photos' => [$photo],
        ]);
        $fromRequest = PortfolioStepRequestDto::fromRequest(new Request(files: [
            'cover_photo' => $cover,
            'photos' => [$photo],
        ]));

        $this->assertSame($cover, $fromArray->coverPhoto);
        $this->assertSame([$photo], $fromArray->photos);
        $this->assertSame($cover, $fromRequest->coverPhoto);
        $this->assertSame([$photo], $fromRequest->photos);
    }

    private function expectViolation(string $message, string $path): ExecutionContextInterface
    {
        $builder = $this->createMock(ConstraintViolationBuilderInterface::class);
        $builder->expects($this->once())->method('atPath')->with($path)->willReturnSelf();
        $builder->expects($this->once())->method('addViolation');

        $context = $this->createMock(ExecutionContextInterface::class);
        $context->expects($this->once())->method('buildViolation')->with($message)->willReturn($builder);

        return $context;
    }
}
