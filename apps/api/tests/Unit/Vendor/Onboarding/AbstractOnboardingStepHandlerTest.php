<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\DTO\DTOInterface;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Exception\ValidationException;
use App\Handler\Vendor\Onboarding\AbstractOnboardingStepHandler;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class AbstractOnboardingStepHandlerTest extends TestCase
{
    public function test_default_methods_support_all_vendor_types_and_empty_step_data(): void
    {
        $handler = new TestableOnboardingStepHandler($this->createStub(ValidatorInterface::class));

        $this->assertTrue($handler->supportsVendorType(VendorType::Freelance));
        $this->assertSame([], $handler->getStepData(new Vendor()));
        $this->assertFalse($handler->isFilled(new Vendor()));
    }

    public function test_validate_returns_dto_when_there_are_no_violations(): void
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $validator->expects($this->once())->method('validate')->willReturn(new ConstraintViolationList());

        $dto = new TestDto();
        $handler = new TestableOnboardingStepHandler($validator);

        $this->assertSame($dto, $handler->validateDto($dto));
    }

    public function test_validate_throws_validation_exception_with_normalized_errors(): void
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $validator->expects($this->once())->method('validate')->willReturn(new ConstraintViolationList([
            new ConstraintViolation('Required.', null, [], null, 'field_name', null),
        ]));

        $handler = new TestableOnboardingStepHandler($validator);

        try {
            $handler->validateDto(new TestDto());
            $this->fail('Expected ValidationException.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                [['field' => 'field_name', 'message' => 'Required.']],
                $exception->getViolations()
            );
        }
    }
}

final readonly class TestableOnboardingStepHandler extends AbstractOnboardingStepHandler
{
    public function supports(): OnboardingStep
    {
        return OnboardingStep::Professions;
    }

    public function handle(Vendor $vendor, array $data): void {}

    public function validateDto(DTOInterface $dto): DTOInterface
    {
        return $this->validate($dto);
    }
}

final readonly class TestDto implements DTOInterface
{
    public static function fromArray(array $data): static
    {
        return new self();
    }
}
