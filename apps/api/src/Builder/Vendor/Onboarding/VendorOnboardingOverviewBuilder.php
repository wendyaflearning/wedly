<?php

declare(strict_types=1);

namespace App\Builder\Vendor\Onboarding;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\DTO\Vendor\VendorOnboardingStepResponseDto;
use App\DTO\Vendor\Onboarding\Response\OnboardingOverviewResponseDto;
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
        $vendorType     = $vendor->resolveVendorType();
        $allSteps       = $this->resolver->getOnboardingSteps($vendorType);
        $filledSteps    = $this->buildFilledStepsMap($vendor, $vendorType);
        $consentGranted = $this->resolveConsentGranted($vendor, $vendorType);
        $allSteps       = $this->filterSensitiveSteps($allSteps, $consentGranted);

        $currentStep = $allSteps[count($allSteps) - 1];
        foreach ($allSteps as $step) {
            if (!($filledSteps[$step->value] ?? false)) {
                $currentStep = $step;
                break;
            }
        }

        $steps     = $this->resolver->resolveAllSteps($vendorType, $currentStep, $filledSteps, $allSteps);
        $stepsData = [];

        foreach ($allSteps as $step) {
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
        $vendorType     = $vendor->resolveVendorType();
        $allSteps       = $this->resolver->getOnboardingSteps($vendorType);
        $filledSteps    = $this->buildFilledStepsMap($vendor, $vendorType);
        $consentGranted = $this->resolveConsentGranted($vendor, $vendorType);
        $allSteps       = $this->filterSensitiveSteps($allSteps, $consentGranted);

        $currentStep = $allSteps[count($allSteps) - 1];
        foreach ($allSteps as $step) {
            if (!($filledSteps[$step->value] ?? false)) {
                $currentStep = $step;
                break;
            }
        }

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

    /**
     * @param array<OnboardingStep> $steps
     * @return array<OnboardingStep>
     */
    private function filterSensitiveSteps(array $steps, ?bool $consentGranted): array
    {
        if ($consentGranted === true) {
            return $steps;
        }

        return array_values(array_filter($steps, fn(OnboardingStep $s) => $s !== OnboardingStep::Experiences));
    }

    private function resolveConsentGranted(Vendor $vendor, VendorType $vendorType): ?bool
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports() === OnboardingStep::Consent && $handler->supportsVendorType($vendorType)) {
                $data = $handler->getStepData($vendor);
                return $data['granted'] ?? null;
            }
        }

        return null;
    }

    /** @return array<string, bool> */
    private function buildFilledStepsMap(Vendor $vendor, VendorType $vendorType): array
    {
        $filledSteps = [];
        foreach ($this->resolver->getOnboardingSteps($vendorType) as $step) {
            foreach ($this->handlers as $handler) {
                if ($handler->supports() === $step && $handler->supportsVendorType($vendorType)) {
                    $filledSteps[$step->value] = $handler->isFilled($vendor);
                    break;
                }
            }
        }

        return $filledSteps;
    }
}
