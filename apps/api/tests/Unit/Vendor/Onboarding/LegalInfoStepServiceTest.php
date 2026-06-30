<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Handler\Vendor\Onboarding\LegalInfoStepHandler;
use App\Integration\Pappers\PappersService;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class LegalInfoStepServiceTest extends TestCase
{
    private ValidatorInterface&Stub $validator;

    private const VALID_SIRET = '12345678901234';

    private const VALID_DATA = [
        'brand_name' => 'Studio Lumière',
        'first_name' => 'Camille',
        'last_name'  => 'Martin',
        'siret'      => self::VALID_SIRET,
        'phone'      => '0612345678',
        'address'    => '12 rue de la Paix',
        'zipcode'    => '75001',
        'city'       => 'Paris',
    ];

    protected function setUp(): void
    {
        $this->validator = $this->createStub(ValidatorInterface::class);
        $this->validator->method('validate')->willReturn(new ConstraintViolationList());
    }

    private function makeService(PappersService $pappers, ?LoggerInterface $logger = null): LegalInfoStepHandler
    {
        return new LegalInfoStepHandler(
            $pappers,
            $logger ?? $this->createStub(LoggerInterface::class),
            $this->validator
        );
    }

    // --- handle() : champs DTO → Vendor ---

    public function test_handle_hydrates_vendor_fields_from_dto(): void
    {
        $pappers = $this->createStub(PappersService::class);
        $pappers->method('findBySiret')->willReturn($this->activePappersData());

        $vendor = $this->createMock(Vendor::class);
        $this->attachUser($vendor);
        $vendor->expects($this->once())->method('setBrandName')->with('Studio Lumière');
        $vendor->expects($this->once())->method('setSiret')->with(self::VALID_SIRET);
        $vendor->expects($this->once())->method('setPhone')->with('0612345678');
        $vendor->expects($this->once())->method('setAddress')->with('12 rue de la Paix');
        $vendor->expects($this->once())->method('setZipcode')->with('75001');
        $vendor->expects($this->once())->method('setCity')->with('Paris');

        $this->makeService($pappers)->handle($vendor, self::VALID_DATA);
    }

    // --- handle() : entreprise active ---

    public function test_handle_sets_siret_verified_true_when_company_is_active(): void
    {
        $pappers = $this->createStub(PappersService::class);
        $pappers->method('findBySiret')->willReturn($this->activePappersData());

        $vendor = $this->createMock(Vendor::class);
        $this->attachUser($vendor);
        $vendor->expects($this->once())->method('setSiretVerified')->with(true);

        $this->makeService($pappers)->handle($vendor, self::VALID_DATA);
    }

    public function test_handle_hydrates_legal_fields_from_pappers(): void
    {
        $data    = $this->activePappersData();
        $pappers = $this->createStub(PappersService::class);
        $pappers->method('findBySiret')->willReturn($data);

        $vendor = $this->createMock(Vendor::class);
        $this->attachUser($vendor);
        $vendor->expects($this->once())->method('setLegalName')->with($data['legal_name']);
        $vendor->expects($this->once())->method('setLegalForm')->with($data['legal_form']);
        $vendor->expects($this->once())->method('setLegalStatus')->with($data['legal_status']);

        $this->makeService($pappers)->handle($vendor, self::VALID_DATA);
    }

    // --- handle() : entreprise inactive ---

    public function test_handle_sets_siret_verified_false_when_company_is_inactive(): void
    {
        $pappers = $this->createStub(PappersService::class);
        $pappers->method('findBySiret')->willReturn(array_merge(
            $this->activePappersData(),
            ['legal_status' => 'Radiée']
        ));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning')->with(
            'SIRET trouvé mais entreprise inactive',
            $this->arrayHasKey('statut')
        );

        $vendor = $this->createMock(Vendor::class);
        $this->attachUser($vendor);
        $vendor->expects($this->once())->method('setSiretVerified')->with(false);

        $this->makeService($pappers, $logger)->handle($vendor, self::VALID_DATA);
    }

    // --- handle() : Pappers inaccessible ---

    public function test_handle_sets_siret_verified_false_when_pappers_unavailable(): void
    {
        $pappers = $this->createStub(PappersService::class);
        $pappers->method('findBySiret')->willReturn(null);

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning')->with(
            'SIRET non vérifié via Pappers',
            $this->arrayHasKey('siret')
        );

        $vendor = $this->createMock(Vendor::class);
        $this->attachUser($vendor);
        $vendor->expects($this->once())->method('setSiretVerified')->with(false);
        $vendor->expects($this->never())->method('setLegalStatus');

        $this->makeService($pappers, $logger)->handle($vendor, self::VALID_DATA);
    }

    // --- getStepData() ---

    public function test_get_step_data_returns_empty_array_when_siret_is_null(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getSiret')->willReturn(null);

        $result = $this->makeService($this->createStub(PappersService::class))->getStepData($vendor);

        $this->assertSame([], $result);
    }

    public function test_get_step_data_returns_full_legal_payload(): void
    {
        $vendor = $this->createStub(Vendor::class);
        $vendor->method('getSiret')->willReturn(self::VALID_SIRET);
        $user = $this->createStub(User::class);
        $user->method('getFirstName')->willReturn('Camille');
        $user->method('getLastName')->willReturn('Martin');
        $vendor->method('getUser')->willReturn($user);
        $vendor->method('getBrandName')->willReturn('Studio Lumière');
        $vendor->method('getPhone')->willReturn('0612345678');
        $vendor->method('getAddress')->willReturn('12 rue de la Paix');
        $vendor->method('getZipcode')->willReturn('75001');
        $vendor->method('getCity')->willReturn('Paris');
        $vendor->method('isSiretVerified')->willReturn(true);
        $vendor->method('getLegalName')->willReturn('Studio Lumière SAS');
        $vendor->method('getLegalForm')->willReturn('Société par actions simplifiée');
        $vendor->method('getLegalStatus')->willReturn('Actif');

        $result = $this->makeService($this->createStub(PappersService::class))->getStepData($vendor);

        $this->assertSame(self::VALID_SIRET, $result['siret']);
        $this->assertSame('Studio Lumière', $result['brand_name']);
        $this->assertSame('75001', $result['zipcode']);
        $this->assertSame('Paris', $result['city']);
        $this->assertTrue($result['siret_verified']);
        $this->assertSame('Actif', $result['legal_status']);
        $this->assertArrayHasKey('legal_name', $result);
        $this->assertArrayHasKey('legal_form', $result);
    }

    // --- helpers ---

    private function attachUser(Vendor&MockObject $vendor): void
    {
        $user = $this->createStub(User::class);
        $user->method('setFirstName')->willReturnSelf();
        $user->method('setLastName')->willReturnSelf();
        $vendor->method('getUser')->willReturn($user);
    }

    private function activePappersData(): array
    {
        return [
            'legal_name'      => 'Studio Lumière SAS',
            'legal_form'      => 'Société par actions simplifiée',
            'incorporated_at' => '2018-03-15',
            'legal_status'    => 'Actif',
            'address'         => '12 rue de la Paix',
            'zipcode'         => '75001',
            'city'            => 'Paris',
        ];
    }
}
