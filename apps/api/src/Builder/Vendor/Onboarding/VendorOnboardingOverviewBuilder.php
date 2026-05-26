<?php

declare(strict_types=1);

namespace App\Builder\Vendor\Onboarding;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\DTO\Vendor\VendorOnboardingStepResponseDto;
use App\Vendor\DTO\Response\OnboardingOverviewResponseDto;
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;

readonly class VendorOnboardingOverviewBuilder
{
    public function __construct(
        private OnboardingStepResolver $resolver,
        #[TaggedIterator('onboarding.step_handler')]
        private iterable $handlers,
    ) {}

    public function build(Vendor $vendor): OnboardingOverviewResponseDto
    {
        $vendorType    = $vendor->resolveVendorType();
        $lastCompleted = $vendor->getOnboardingStep();

        $currentStep = $lastCompleted === null
            ? OnboardingStep::Professions
            : ($this->resolver->resolveNextStep($vendorType, $lastCompleted) ?? $lastCompleted);

        $steps     = $this->resolver->resolveAllSteps($vendorType, $currentStep);
        $stepsData = [];

        foreach ($this->resolver->getOnboardingSteps($vendorType) as $step) {
            foreach ($this->handlers as $handler) {
                if ($handler->supports() === $step && $handler->supportsVendorType($vendorType)) {
                    $stepData = $handler->getStepData($vendor);
                    if (!empty($stepData)) {
                        $stepsData[$step->value] = $stepData;
                    }
                    break;
                }
            }
        }

        return new OnboardingOverviewResponseDto(
            firstname:   $vendor->getUser()->getFirstName(),
            vendor_type: $vendorType->value,
            steps:       $steps,
            steps_data:  $stepsData,
        );
    }

    public function buildStepResponse(Vendor $vendor): VendorOnboardingStepResponseDto
    {
        $vendorType    = $vendor->resolveVendorType();
        $lastCompleted = $vendor->getOnboardingStep();

        $currentStep = $lastCompleted === null
            ? OnboardingStep::Professions
            : ($this->resolver->resolveNextStep($vendorType, $lastCompleted) ?? $lastCompleted);

        $allSteps     = $this->resolver->getOnboardingSteps($vendorType);
        $currentIndex = array_search($currentStep, $allSteps, true);
        $completed    = $currentIndex !== false ? array_slice($allSteps, 0, $currentIndex) : [];

        $stepsData = [];
        foreach ($completed as $step) {
            foreach ($this->handlers as $handler) {
                if ($handler->supports() === $step && $handler->supportsVendorType($vendorType)) {
                    $stepData = $handler->getStepData($vendor);
                    if (!empty($stepData)) {
                        $stepsData[$step->value] = $stepData;
                    }
                    break;
                }
            }
        }

        return new VendorOnboardingStepResponseDto(
            next:      $currentStep,
            completed: $completed,
            stepsData: $stepsData,
        );
    }
}
