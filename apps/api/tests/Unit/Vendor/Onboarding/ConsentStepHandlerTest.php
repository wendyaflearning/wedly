<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\ConsentStepRequestDto;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorConsent;
use App\Enum\Vendor\ConsentType;
use App\Enum\Vendor\OnboardingStep;
use App\Handler\Vendor\Onboarding\ConsentStepHandler;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ConsentStepHandlerTest extends TestCase
{
    public function test_consent_request_dto_requires_native_boolean(): void
    {
        $this->assertTrue(ConsentStepRequestDto::fromArray(['granted' => true])->granted);
        $this->assertFalse(ConsentStepRequestDto::fromArray(['granted' => false])->granted);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Le champ "granted" doit être un booléen natif.');

        ConsentStepRequestDto::fromArray(['granted' => 'true']);
    }

    public function test_consent_request_dto_requires_granted_field(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Le champ "granted" est requis.');

        ConsentStepRequestDto::fromArray([]);
    }

    public function test_supports_consent_step(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::Consent, $handler->supports());
    }

    public function test_record_persists_new_sensitive_data_consent(): void
    {
        $vendor = new Vendor();
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (VendorConsent $consent) use ($vendor): bool {
                return $consent->getVendor() === $vendor
                    && $consent->getConsentType() === ConsentType::SensitiveData
                    && $consent->isGranted();
            }));

        $consent = $this->makeHandler($em)->record($vendor, ['granted' => true]);

        $this->assertSame($vendor, $consent->getVendor());
        $this->assertTrue($consent->isGranted());
    }

    public function test_vendor_consent_exposes_identifier_and_can_update_granted_value(): void
    {
        $consent = new VendorConsent(new Vendor(), ConsentType::SensitiveData, false);
        $id = new UuidV7();
        $property = new \ReflectionProperty(VendorConsent::class, 'id');
        $property->setValue($consent, $id);

        $consent->setGranted(true);

        $this->assertSame($id, $consent->getId());
        $this->assertTrue($consent->isGranted());
    }

    public function test_handle_updates_existing_consent(): void
    {
        $vendor = new Vendor();
        $consent = new VendorConsent($vendor, ConsentType::SensitiveData, false);

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(
                ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
                ['createdAt' => 'DESC', 'id' => 'DESC']
            )
            ->willReturn($consent);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(VendorConsent::class)->willReturn($repository);
        $em->expects($this->never())->method('persist');

        $this->makeHandler($em)->handle($vendor, ['granted' => true]);

        $this->assertTrue($consent->isGranted());
    }

    public function test_handle_persists_new_consent_when_none_exists(): void
    {
        $vendor = new Vendor();

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('findOneBy')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(VendorConsent::class)->willReturn($repository);
        $em->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(VendorConsent::class));

        $this->makeHandler($em)->handle($vendor, ['granted' => false]);
    }

    public function test_is_filled_and_get_step_data_read_latest_consent(): void
    {
        $vendor = new Vendor();
        $consent = new VendorConsent($vendor, ConsentType::SensitiveData, true);

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->exactly(2))
            ->method('findOneBy')
            ->with(
                ['vendor' => $vendor, 'consentType' => ConsentType::SensitiveData],
                ['createdAt' => 'DESC', 'id' => 'DESC']
            )
            ->willReturn($consent);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))->method('getRepository')->with(VendorConsent::class)->willReturn($repository);

        $handler = $this->makeHandler($em);

        $this->assertTrue($handler->isFilled($vendor));
        $this->assertSame(['granted' => true], $handler->getStepData($vendor));
    }

    public function test_get_step_data_returns_empty_array_when_consent_is_missing(): void
    {
        $vendor = new Vendor();

        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('findOneBy')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(VendorConsent::class)->willReturn($repository);

        $this->assertSame([], $this->makeHandler($em)->getStepData($vendor));
    }

    private function makeHandler(EntityManagerInterface $em): ConsentStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new ConsentStepHandler($em, $validator);
    }
}
