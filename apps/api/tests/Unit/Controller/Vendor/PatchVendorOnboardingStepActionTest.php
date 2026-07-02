<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Vendor;

use App\Controller\Vendor\Onboarding\PatchVendorOnboardingStepAction;
use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\DTO\Vendor\VendorOnboardingStepResponseDto;
use App\Entity\User\InviteToken;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Service\InviteTokenService;
use App\Dispatcher\Vendor\Onboarding\VendorOnboardingStepDispatcher;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PatchVendorOnboardingStepActionTest extends TestCase
{
    private InviteTokenService&Stub $inviteTokenService;
    private ValidatorInterface&Stub $validator;
    private VendorOnboardingStepDispatcher&Stub $dispatcher;

    protected function setUp(): void
    {
        $this->inviteTokenService = $this->createStub(InviteTokenService::class);
        $this->validator = $this->createStub(ValidatorInterface::class);
        $this->dispatcher = $this->createStub(VendorOnboardingStepDispatcher::class);
    }

    public function test_invoke_returns_422_when_request_dto_is_invalid(): void
    {
        $inviteToken = $this->createStub(InviteToken::class);
        $inviteToken->method('getVendor')->willReturn($this->createStub(Vendor::class));

        $this->inviteTokenService->method('resolve')->willReturn($inviteToken);
        $this->validator->method('validate')->willReturn(new ConstraintViolationList([
            new ConstraintViolation(
                'This value should not be blank.',
                null,
                [],
                null,
                'step',
                ''
            ),
        ]));

        $action = $this->makeAction();

        $response = $action->__invoke('token-123', new Request(
            content: json_encode(['data' => ['foo' => 'bar']], JSON_THROW_ON_ERROR)
        ));

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['errors' => ['step: This value should not be blank.']],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_returns_422_when_token_has_no_vendor(): void
    {
        $inviteToken = $this->createStub(InviteToken::class);
        $inviteToken->method('getVendor')->willReturn(null);

        $this->inviteTokenService->method('resolve')->willReturn($inviteToken);

        $action = $this->makeAction();

        $response = $action->__invoke('token-123', new Request(
            content: json_encode(['step' => 'legal_info', 'data' => []], JSON_THROW_ON_ERROR)
        ));

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            ['error' => 'Aucun prestataire associé à ce token'],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function test_invoke_consumes_token_and_returns_204_when_dispatcher_returns_null(): void
    {
        $inviteToken = $this->createStub(InviteToken::class);
        $vendor = $this->createStub(Vendor::class);

        $inviteToken->method('getVendor')->willReturn($vendor);
        $this->inviteTokenService->method('resolve')->willReturn($inviteToken);
        $this->validator->method('validate')->willReturn(new ConstraintViolationList());

        $capturedDto = null;
        $dispatcher = $this->createMock(VendorOnboardingStepDispatcher::class);
        $dispatcher->expects($this->once())
            ->method('handle')
            ->with(
                $vendor,
                $this->callback(function (VendorOnboardingStepRequestDto $dto) use (&$capturedDto): bool {
                    $capturedDto = $dto;

                    return true;
                })
            )
            ->willReturn(null);

        $inviteTokenService = $this->createMock(InviteTokenService::class);
        $inviteTokenService->expects($this->once())->method('resolve')->with('token-123')->willReturn($inviteToken);
        $inviteTokenService->expects($this->once())->method('consume')->with($inviteToken);

        $action = new PatchVendorOnboardingStepAction($inviteTokenService, $this->validator, $dispatcher);

        $response = $action->__invoke('token-123', new Request(
            content: json_encode([
                'step' => OnboardingStep::Credentials->value,
                'data' => ['email' => 'denis@example.com'],
            ], JSON_THROW_ON_ERROR)
        ));

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame('{}', (string) $response->getContent());
        $this->assertInstanceOf(VendorOnboardingStepRequestDto::class, $capturedDto);
        $this->assertSame(OnboardingStep::Credentials->value, $capturedDto->step);
        $this->assertSame(['email' => 'denis@example.com'], $capturedDto->data);
    }

    public function test_invoke_returns_json_response_when_dispatcher_returns_payload(): void
    {
        $inviteToken = $this->createStub(InviteToken::class);
        $vendor = $this->createStub(Vendor::class);

        $inviteToken->method('getVendor')->willReturn($vendor);
        $this->inviteTokenService->method('resolve')->willReturn($inviteToken);
        $this->validator->method('validate')->willReturn(new ConstraintViolationList());

        $responseDto = new VendorOnboardingStepResponseDto(
            next: OnboardingStep::Credentials,
            completed: [OnboardingStep::Professions, OnboardingStep::LegalInfo],
            stepsData: ['legal_info' => ['siret' => '12345678901234']]
        );

        $dispatcher = $this->createMock(VendorOnboardingStepDispatcher::class);
        $dispatcher->expects($this->once())->method('handle')->willReturn($responseDto);

        $action = new PatchVendorOnboardingStepAction($this->inviteTokenService, $this->validator, $dispatcher);

        $response = $action->__invoke('token-123', new Request(
            content: json_encode([
                'step' => OnboardingStep::LegalInfo->value,
                'data' => ['brand_name' => 'Studio Lumiere'],
            ], JSON_THROW_ON_ERROR)
        ));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            [
                'current_step' => 'credentials',
                'completed_steps' => ['professions', 'legal_info'],
                'steps_data' => ['legal_info' => ['siret' => '12345678901234']],
            ],
            json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    private function makeAction(): PatchVendorOnboardingStepAction
    {
        return new PatchVendorOnboardingStepAction(
            $this->inviteTokenService,
            $this->validator,
            $this->dispatcher
        );
    }
}
