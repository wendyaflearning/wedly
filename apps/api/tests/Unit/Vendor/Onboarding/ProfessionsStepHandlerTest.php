<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Handler\Vendor\Onboarding\ProfessionsStepHandler;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ProfessionsStepHandlerTest extends TestCase
{
    public function test_supports_professions_step(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::Professions, $handler->supports());
    }

    public function test_handle_replaces_vendor_services(): void
    {
        $photographer = $this->serviceWithId('Photographe', 'photographe', VendorType::Freelance);
        $dj = $this->serviceWithId('DJ', 'dj', VendorType::Freelance);

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->exactly(2))
            ->method('find')
            ->willReturnMap([
                ['service-1', null, null, $photographer],
                ['service-2', null, null, $dj],
            ]);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))
            ->method('getRepository')
            ->with(Service::class)
            ->willReturn($repository);

        $vendor = (new Vendor())->addService($this->serviceWithId('Old', 'old', VendorType::Freelance));

        $this->makeHandler($em)->handle($vendor, ['service_ids' => ['service-1', 'service-2']]);

        $this->assertSame([$photographer, $dj], $vendor->getServices()->toArray());
    }

    public function test_handle_throws_when_service_cannot_be_found(): void
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('find')->with('missing-service')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(Service::class)->willReturn($repository);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Service introuvable : missing-service');

        $this->makeHandler($em)->handle(new Vendor(), ['service_ids' => ['missing-service']]);
    }

    public function test_is_filled_reflects_vendor_services(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertFalse($handler->isFilled(new Vendor()));
        $this->assertTrue($handler->isFilled(
            (new Vendor())->addService($this->serviceWithId('Photographe', 'photographe', VendorType::Freelance))
        ));
    }

    public function test_get_step_data_returns_selected_services(): void
    {
        $service = $this->serviceWithId('Photographe', 'photographe', VendorType::Freelance);
        $vendor = (new Vendor())->addService($service);

        $result = $this->makeHandler($this->createStub(EntityManagerInterface::class))->getStepData($vendor);

        $this->assertSame('Photographe', $result['services'][0]['name']);
        $this->assertIsString($result['services'][0]['id']);
    }

    private function makeHandler(EntityManagerInterface $em): ProfessionsStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new ProfessionsStepHandler($em, $validator);
    }

    private function serviceWithId(string $name, string $slug, VendorType $category): Service
    {
        $service = (new Service())
            ->setName($name)
            ->setSlug($slug)
            ->setSortOrder(1)
            ->setCategory($category);

        $id = new \ReflectionProperty(Service::class, 'id');
        $id->setValue($service, new UuidV7());

        return $service;
    }
}
