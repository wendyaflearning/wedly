<?php

declare(strict_types=1);

namespace App\Tests\Unit\Dispatcher\Vendor\Onboarding;

use App\Dispatcher\Vendor\Onboarding\VendorOnboardingStepDispatcher;
use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Event\StepperSubmittedEvent;
use App\Handler\Vendor\Onboarding\StepHandlerInterface;
use App\Resolver\Vendor\OnboardingStepResolver;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class VendorOnboardingStepDispatcherTest extends TestCase
{
    public function test_handle_progresses_step_and_returns_completed_steps_data(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $eventDispatcher = $this->createMock(EventDispatcherInterface::class);
        $eventDispatcher->expects($this->never())->method('dispatch');

        $professionsHandler = new TestStepHandler(
            OnboardingStep::Professions,
            filled: true,
            stepData: ['services' => ['photographe']]
        );
        $experiencesHandler = new TestStepHandler(OnboardingStep::Experiences, filled: true);
        $consentHandler = new TestStepHandler(OnboardingStep::Consent, filled: true);
        $zonesPricingHandler = new TestStepHandler(OnboardingStep::ZonesPricing, filled: true);
        $portfolioHandler = new TestStepHandler(OnboardingStep::Portfolio, filled: true);
        $legalInfoHandler = new TestStepHandler(
            OnboardingStep::LegalInfo,
            filled: true,
            stepData: ['siret' => '12345678901234']
        );

        $dispatcher = new VendorOnboardingStepDispatcher(
            $em,
            new OnboardingStepResolver(),
            $eventDispatcher,
            [
                $professionsHandler,
                $consentHandler,
                $experiencesHandler,
                $zonesPricingHandler,
                $portfolioHandler,
                $legalInfoHandler,
            ]
        );

        $vendor = $this->createMock(Vendor::class);
        $vendor->method('resolveVendorType')->willReturn(VendorType::Freelance);
        $vendor->method('getOnboardingStep')->willReturn(OnboardingStep::Portfolio);
        $vendor->expects($this->once())->method('setOnboardingStep')->with(OnboardingStep::LegalInfo);

        $response = $dispatcher->handle(
            $vendor,
            new VendorOnboardingStepRequestDto(
                step: OnboardingStep::LegalInfo->value,
                data: ['brand_name' => 'Studio Lumiere']
            )
        );

        $this->assertNotNull($response);
        $this->assertSame(OnboardingStep::Credentials->value, $response->current_step);
        $this->assertSame(
            ['professions', 'consent', 'experiences', 'zones_pricing', 'portfolio', 'legal_info'],
            $response->completed_steps
        );
        $this->assertSame(['brand_name' => 'Studio Lumiere'], $legalInfoHandler->handledPayloads[0]);
        $this->assertSame(
            [
                'professions' => ['services' => ['photographe']],
                'legal_info' => ['siret' => '12345678901234'],
            ],
            $response->steps_data
        );
    }

    public function test_handle_throws_when_step_is_unknown(): void
    {
        $dispatcher = new VendorOnboardingStepDispatcher(
            $this->createStub(EntityManagerInterface::class),
            new OnboardingStepResolver(),
            $this->createStub(EventDispatcherInterface::class),
            []
        );

        $vendor = $this->createStub(Vendor::class);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Étape inconnue : unknown');

        $dispatcher->handle($vendor, new VendorOnboardingStepRequestDto(step: 'unknown', data: null));
    }

    public function test_handle_throws_when_no_handler_supports_step_for_vendor_type(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $dispatcher = new VendorOnboardingStepDispatcher(
            $em,
            new OnboardingStepResolver(),
            $this->createStub(EventDispatcherInterface::class),
            [
                new TestStepHandler(OnboardingStep::Professions, filled: true, vendorType: VendorType::Lieu),
            ]
        );

        $vendor = $this->createStub(Vendor::class);
        $vendor->method('resolveVendorType')->willReturn(VendorType::Freelance);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(500);
        $this->expectExceptionMessage("Aucun handler pour l'étape : professions");

        $dispatcher->handle(
            $vendor,
            new VendorOnboardingStepRequestDto(step: OnboardingStep::Professions->value, data: null)
        );
    }

    public function test_handle_credentials_throws_when_previous_steps_are_incomplete(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $eventDispatcher = $this->createMock(EventDispatcherInterface::class);
        $eventDispatcher->expects($this->never())->method('dispatch');

        $credentialsHandler = new TestStepHandler(OnboardingStep::Credentials, filled: true);

        $dispatcher = new VendorOnboardingStepDispatcher(
            $em,
            new OnboardingStepResolver(),
            $eventDispatcher,
            [
                new TestStepHandler(OnboardingStep::Professions, filled: true),
                new TestStepHandler(OnboardingStep::Consent, filled: true),
                new TestStepHandler(OnboardingStep::Experiences, filled: true),
                new TestStepHandler(OnboardingStep::ZonesPricing, filled: false),
                new TestStepHandler(OnboardingStep::Portfolio, filled: true),
                new TestStepHandler(OnboardingStep::LegalInfo, filled: true),
                $credentialsHandler,
            ]
        );

        $vendor = $this->createStub(Vendor::class);
        $vendor->method('resolveVendorType')->willReturn(VendorType::Freelance);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Étapes incomplètes : Zones et tarifs');

        try {
            $dispatcher->handle(
                $vendor,
                new VendorOnboardingStepRequestDto(
                    step: OnboardingStep::Credentials->value,
                    data: ['email' => 'denis@example.com']
                )
            );
        } finally {
            $this->assertSame([], $credentialsHandler->handledPayloads);
        }
    }

    public function test_handle_credentials_dispatches_submission_event_when_all_steps_are_complete(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $eventDispatcher = $this->createMock(EventDispatcherInterface::class);
        $eventDispatcher->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(function (StepperSubmittedEvent $event): bool {
                return $event->firstName === 'Denis' && $event->email === 'denis@example.com';
            }));

        $credentialsHandler = new TestStepHandler(OnboardingStep::Credentials, filled: true);

        $dispatcher = new VendorOnboardingStepDispatcher(
            $em,
            new OnboardingStepResolver(),
            $eventDispatcher,
            [
                new TestStepHandler(OnboardingStep::Professions, filled: true),
                new TestStepHandler(OnboardingStep::Consent, filled: true),
                new TestStepHandler(OnboardingStep::Experiences, filled: true),
                new TestStepHandler(OnboardingStep::ZonesPricing, filled: true),
                new TestStepHandler(OnboardingStep::Portfolio, filled: true),
                new TestStepHandler(OnboardingStep::LegalInfo, filled: true),
                $credentialsHandler,
            ]
        );

        $user = $this->createStub(User::class);
        $user->method('getFirstName')->willReturn('Denis');
        $user->method('getEmail')->willReturn('denis@example.com');

        $vendor = $this->createMock(Vendor::class);
        $vendor->method('resolveVendorType')->willReturn(VendorType::Freelance);
        $vendor->method('getOnboardingStep')->willReturn(OnboardingStep::LegalInfo);
        $vendor->method('getUser')->willReturn($user);
        $vendor->expects($this->once())->method('setOnboardingStep')->with(OnboardingStep::Credentials);

        $response = $dispatcher->handle(
            $vendor,
            new VendorOnboardingStepRequestDto(
                step: OnboardingStep::Credentials->value,
                data: ['email' => 'denis@example.com']
            )
        );

        $this->assertNull($response);
        $this->assertSame([['email' => 'denis@example.com']], $credentialsHandler->handledPayloads);
    }
}

final class TestStepHandler implements StepHandlerInterface
{
    /** @var list<array<string, mixed>> */
    public array $handledPayloads = [];

    /** @param array<string, mixed> $stepData */
    public function __construct(
        private readonly OnboardingStep $step,
        private readonly bool $filled,
        private readonly array $stepData = [],
        private readonly VendorType $vendorType = VendorType::Freelance,
    ) {}

    public function supports(): OnboardingStep
    {
        return $this->step;
    }

    public function supportsVendorType(VendorType $type): bool
    {
        return $this->vendorType === $type;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        $this->handledPayloads[] = $data;
    }

    public function getStepData(Vendor $vendor): array
    {
        return $this->stepData;
    }

    public function isFilled(Vendor $vendor): bool
    {
        return $this->filled;
    }
}
