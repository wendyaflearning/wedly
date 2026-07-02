<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Creator\CreatorValue;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCreatorDetails;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Handler\Vendor\Onboarding\CreatorProcessStepHandler;
use App\Handler\Vendor\Onboarding\CreatorUniverseStepHandler;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CreatorStepHandlersTest extends TestCase
{
    public function test_creator_universe_supports_only_creator_vendor_type(): void
    {
        $handler = $this->makeUniverseHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::CreatorUniverse, $handler->supports());
        $this->assertTrue($handler->supportsVendorType(VendorType::Createurs));
        $this->assertFalse($handler->supportsVendorType(VendorType::Freelance));
    }

    public function test_creator_universe_creates_details_and_persists_them(): void
    {
        $value = $this->creatorValueWithId('Sur-mesure', 'sur-mesure');

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('find')->with('value-1')->willReturn($value);

        $vendor = new Vendor();
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(CreatorValue::class)->willReturn($repository);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (VendorCreatorDetails $details) use ($vendor, $value): bool {
                return $details->getVendor() === $vendor
                    && $details->isHasFixedWorkshop() === true
                    && $details->getCreatorValues()->toArray() === [$value];
            }));

        $this->makeUniverseHandler($em)->handle($vendor, [
            'creator_value_ids' => ['value-1'],
            'has_fixed_workshop' => true,
        ]);
    }

    public function test_creator_universe_updates_existing_details_without_persisting(): void
    {
        $value = $this->creatorValueWithId('Ethique', 'ethique');
        $details = (new VendorCreatorDetails())->setHasFixedWorkshop(false);
        $vendor = (new Vendor())->setCreatorDetails($details);

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('find')->with('value-2')->willReturn($value);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(CreatorValue::class)->willReturn($repository);
        $em->expects($this->never())->method('persist');

        $this->makeUniverseHandler($em)->handle($vendor, [
            'creator_value_ids' => ['value-2'],
            'has_fixed_workshop' => true,
        ]);

        $this->assertTrue($details->isHasFixedWorkshop());
        $this->assertSame([$value], $details->getCreatorValues()->toArray());
    }

    public function test_creator_universe_throws_when_value_cannot_be_found(): void
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('find')->with('missing-value')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(CreatorValue::class)->willReturn($repository);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Valeur créateur introuvable : missing-value');

        $this->makeUniverseHandler($em)->handle(new Vendor(), [
            'creator_value_ids' => ['missing-value'],
            'has_fixed_workshop' => false,
        ]);
    }

    public function test_creator_universe_step_data_returns_empty_array_until_details_exist(): void
    {
        $result = $this->makeUniverseHandler($this->createStub(EntityManagerInterface::class))->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_creator_universe_step_data_returns_details_payload(): void
    {
        $value = $this->creatorValueWithId('Local', 'local');
        $details = (new VendorCreatorDetails())
            ->setHasFixedWorkshop(true)
            ->addCreatorValue($value);

        $vendor = (new Vendor())->setCreatorDetails($details);

        $result = $this->makeUniverseHandler($this->createStub(EntityManagerInterface::class))->getStepData($vendor);

        $this->assertTrue($result['has_fixed_workshop']);
        $this->assertSame('Local', $result['creator_value_ids'][0]['name']);
        $this->assertIsString($result['creator_value_ids'][0]['id']);
    }

    public function test_creator_process_supports_only_creator_vendor_type(): void
    {
        $handler = $this->makeProcessHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::CreatorProcess, $handler->supports());
        $this->assertTrue($handler->supportsVendorType(VendorType::Createurs));
        $this->assertFalse($handler->supportsVendorType(VendorType::Lieu));
    }

    public function test_creator_process_requires_creator_details_first(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Veuillez d\'abord compléter l\'étape "Votre univers".');

        $this->makeProcessHandler($this->createStub(EntityManagerInterface::class))->handle(new Vendor(), [
            'min_lead_time_months' => 6,
            'annual_capacity' => 10,
            'rdv_count' => 2,
            'first_rdv_duration_minutes' => 60,
        ]);
    }

    public function test_creator_process_updates_existing_creator_details(): void
    {
        $details = new VendorCreatorDetails();
        $vendor = (new Vendor())->setCreatorDetails($details);

        $this->makeProcessHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'min_lead_time_months' => 6,
            'annual_capacity' => 20,
            'rdv_count' => 3,
            'first_rdv_duration_minutes' => 90,
        ]);

        $this->assertSame(6, $details->getMinLeadTimeMonths());
        $this->assertSame(20, $details->getAnnualCapacity());
        $this->assertSame(3, $details->getRdvCount());
        $this->assertSame(90, $details->getFirstRdvDurationMinutes());
    }

    public function test_creator_process_step_data_returns_empty_array_until_details_exist(): void
    {
        $result = $this->makeProcessHandler($this->createStub(EntityManagerInterface::class))->getStepData(new Vendor());

        $this->assertSame([], $result);
    }

    public function test_creator_process_step_data_returns_process_payload(): void
    {
        $details = (new VendorCreatorDetails())
            ->setMinLeadTimeMonths(10)
            ->setAnnualCapacity(20)
            ->setRdvCount(4)
            ->setFirstRdvDurationMinutes(120);
        $vendor = (new Vendor())->setCreatorDetails($details);

        $result = $this->makeProcessHandler($this->createStub(EntityManagerInterface::class))->getStepData($vendor);

        $this->assertSame([
            'min_lead_time_months' => 10,
            'annual_capacity' => 20,
            'rdv_count' => 4,
            'first_rdv_duration_minutes' => 120,
        ], $result);
    }

    private function makeUniverseHandler(EntityManagerInterface $em): CreatorUniverseStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new CreatorUniverseStepHandler($em, $validator);
    }

    private function makeProcessHandler(EntityManagerInterface $em): CreatorProcessStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new CreatorProcessStepHandler($em, $validator);
    }

    private function creatorValueWithId(string $name, string $slug): CreatorValue
    {
        $value = (new CreatorValue())->setName($name)->setSlug($slug);
        $id = new \ReflectionProperty(CreatorValue::class, 'id');
        $id->setValue($value, new UuidV7());

        return $value;
    }
}
