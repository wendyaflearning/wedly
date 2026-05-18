<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

#[AutoconfigureTag('onboarding.step_handler')]
interface StepHandlerInterface
{
    public function supports(): OnboardingStep;
    public function supportsVendorType(VendorType $type): bool;
    public function handle(Vendor $vendor, array $data): void;
    public function getStepData(Vendor $vendor): array;
}
