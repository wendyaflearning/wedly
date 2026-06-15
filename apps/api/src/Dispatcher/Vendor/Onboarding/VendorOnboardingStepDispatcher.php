<?php

declare(strict_types=1);

namespace App\Dispatcher\Vendor\Onboarding;

use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\DTO\Vendor\VendorOnboardingStepResponseDto;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\Handler\Vendor\Onboarding\StepHandlerInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;

readonly class VendorOnboardingStepDispatcher
{
    public function __construct(
        private EntityManagerInterface $em,
        private OnboardingStepResolver $resolver,
        #[TaggedIterator('onboarding.step_handler')]
        private iterable $handlers,
    ) {}

    public function handle(Vendor $vendor, VendorOnboardingStepRequestDto $dto): ?VendorOnboardingStepResponseDto
    {
        $step       = OnboardingStep::tryFrom($dto->step)
            ?? throw new \DomainException(sprintf('Étape inconnue : %s', $dto->step), 422);
        $vendorType = $vendor->resolveVendorType();

        $steps = $this->resolver->getOnboardingSteps($vendorType);

        if ($step === OnboardingStep::Credentials) {
            $this->assertAllStepsFilled($vendor, $vendorType, $steps);
        }

        $this->resolveHandler($step, $vendorType)->handle($vendor, $dto->data ?? []);

        $currentStep    = $vendor->getOnboardingStep();
        $currentIndex   = $currentStep ? array_search($currentStep, $steps, true) : -1;
        $submittedIndex = array_search($step, $steps, true);

        if ($submittedIndex > $currentIndex) {
            $vendor->setOnboardingStep($step);
        }

        $this->em->flush();

        if ($step === OnboardingStep::Credentials) {
            return null;
        }

        $completed = array_slice($steps, 0, $submittedIndex + 1);

        return new VendorOnboardingStepResponseDto(
            next:      $this->resolver->resolveNextStep($vendorType, $step),
            completed: $completed,
            stepsData: $this->buildStepsData($vendor, $completed, $vendorType),
        );
    }

    private function resolveHandler(OnboardingStep $step, VendorType $vendorType): StepHandlerInterface
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports() === $step && $handler->supportsVendorType($vendorType)) {
                return $handler;
            }
        }
        throw new \DomainException(sprintf('Aucun handler pour l\'étape : %s', $step->value), 500);
    }

    /** @param array<OnboardingStep> $steps */
    private function assertAllStepsFilled(Vendor $vendor, VendorType $vendorType, array $steps): void
    {
        $incomplete = [];
        foreach ($steps as $stepItem) {
            if ($stepItem === OnboardingStep::Credentials) {
                continue;
            }
            if (!$this->resolveHandler($stepItem, $vendorType)->isFilled($vendor)) {
                $incomplete[] = $stepItem->label($vendorType);
            }
        }
        if (!empty($incomplete)) {
            throw new \DomainException(
                sprintf('Étapes incomplètes : %s', implode(', ', $incomplete)),
                422
            );
        }
    }

    private function buildStepsData(Vendor $vendor, array $completedSteps, VendorType $vendorType): array
    {
        $data = [];
        foreach ($completedSteps as $completedStep) {
            $stepData = $this->resolveHandler($completedStep, $vendorType)->getStepData($vendor);
            if (!empty($stepData)) {
                $data[$completedStep->value] = $stepData;
            }
        }

        return $data;
    }
}
