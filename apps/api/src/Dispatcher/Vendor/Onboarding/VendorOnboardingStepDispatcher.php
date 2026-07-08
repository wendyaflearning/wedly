<?php

declare(strict_types=1);

namespace App\Dispatcher\Vendor\Onboarding;

use App\DTO\Vendor\VendorOnboardingStepRequestDto;
use App\DTO\Vendor\VendorOnboardingStepResponseDto;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Event\StepperSubmittedEvent;
use App\Event\VendorSubmittedForReviewEvent;
use App\Handler\Vendor\Onboarding\StepHandlerInterface;
use App\Repository\Vendor\VendorRepository;
use App\Resolver\Vendor\OnboardingStepResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

readonly class VendorOnboardingStepDispatcher
{
    public function __construct(
        private EntityManagerInterface $em,
        private VendorRepository $vendorRepository,
        private OnboardingStepResolver $resolver,
        private EventDispatcherInterface $eventDispatcher,
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
            $user = $vendor->getUser();
            $this->eventDispatcher->dispatch(new VendorSubmittedForReviewEvent($vendor));
            $this->eventDispatcher->dispatch(
                new StepperSubmittedEvent($user->getFirstName(), $user->getEmail())
            );

            return null;
        }

        $completed = array_slice($steps, 0, $submittedIndex + 1);

        $next = $this->resolver->resolveNextStep($vendorType, $step);

        // Consent refusé → sauter Experiences ; pour Traiteur, CateringCharacteristics reste dans le parcours
        if ($step === OnboardingStep::Consent) {
            if ($this->vendorRepository->findLatestMatchingConsent($vendor) === false) {
                $afterConsent = array_slice($steps, array_search(OnboardingStep::Consent, $steps, true) + 1);
                foreach ($afterConsent as $candidate) {
                    if ($candidate !== OnboardingStep::Experiences) {
                        $next = $candidate;
                        break;
                    }
                }
            }
        }

        return new VendorOnboardingStepResponseDto(
            next:      $next,
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
