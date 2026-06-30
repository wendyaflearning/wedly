<?php

declare(strict_types=1);

namespace App\Tests\Unit\Builder\Vendor\Onboarding;

use App\Builder\Vendor\Onboarding\VendorOnboardingOverviewBuilder;
use App\Entity\User\User;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Handler\Vendor\Onboarding\StepHandlerInterface;
use App\Resolver\Vendor\OnboardingStepResolver;
use PHPUnit\Framework\TestCase;

final class VendorOnboardingOverviewBuilderTest extends TestCase
{
    public function test_build_returns_current_step_statuses_and_available_step_data(): void
    {
        $builder = new VendorOnboardingOverviewBuilder(
            new OnboardingStepResolver(),
            [
                new OverviewTestStepHandler(OnboardingStep::Professions, true, ['services' => ['photographe']]),
                new OverviewTestStepHandler(OnboardingStep::Consent, true, ['granted' => true]),
                new OverviewTestStepHandler(OnboardingStep::Experiences, false),
                new OverviewTestStepHandler(OnboardingStep::ZonesPricing, false),
                new OverviewTestStepHandler(OnboardingStep::Portfolio, false),
                new OverviewTestStepHandler(OnboardingStep::LegalInfo, false),
                new OverviewTestStepHandler(OnboardingStep::Credentials, false),
            ]
        );

        $response = $builder->build($this->freelanceVendor());

        $this->assertSame('Camille', $response->firstname);
        $this->assertSame('freelance', $response->vendor_type);
        $this->assertSame(['services' => ['photographe']], $response->steps_data['professions']);
        $this->assertSame('completed', $response->steps[0]->status);
        $this->assertSame('completed', $response->steps[1]->status);
        $this->assertSame('current', $response->steps[2]->status);
        $this->assertTrue($response->steps[0]->isFilled);
        $this->assertFalse($response->steps[2]->isFilled);
    }

    public function test_build_step_response_returns_next_step_completed_steps_and_completed_step_data(): void
    {
        $builder = new VendorOnboardingOverviewBuilder(
            new OnboardingStepResolver(),
            [
                new OverviewTestStepHandler(OnboardingStep::Professions, true, ['services' => ['photographe']]),
                new OverviewTestStepHandler(OnboardingStep::Consent, true, ['granted' => true]),
                new OverviewTestStepHandler(OnboardingStep::Experiences, true, ['culture_ids' => ['france']]),
                new OverviewTestStepHandler(OnboardingStep::ZonesPricing, false, ['zones' => ['idf']]),
                new OverviewTestStepHandler(OnboardingStep::Portfolio, false),
                new OverviewTestStepHandler(OnboardingStep::LegalInfo, false),
                new OverviewTestStepHandler(OnboardingStep::Credentials, false),
            ]
        );

        $response = $builder->buildStepResponse($this->freelanceVendor());

        $this->assertSame('zones_pricing', $response->current_step);
        $this->assertSame(['professions', 'consent', 'experiences'], $response->completed_steps);
        $this->assertSame(['services' => ['photographe']], $response->steps_data['professions']);
        $this->assertSame(['granted' => true], $response->steps_data['consent']);
        $this->assertSame(['culture_ids' => ['france']], $response->steps_data['experiences']);
        $this->assertArrayNotHasKey('zones_pricing', $response->steps_data);
    }

    public function test_build_ignores_handlers_that_do_not_support_vendor_type(): void
    {
        $builder = new VendorOnboardingOverviewBuilder(
            new OnboardingStepResolver(),
            [
                new OverviewTestStepHandler(
                    OnboardingStep::Professions,
                    true,
                    ['services' => ['traiteur']],
                    VendorType::Traiteur
                ),
            ]
        );

        $response = $builder->build($this->freelanceVendor());

        $this->assertSame('current', $response->steps[0]->status);
        $this->assertSame([], $response->steps_data);
    }

    private function freelanceVendor(): Vendor
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setEmail('camille@example.com');

        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(1)
            ->setCategory(VendorType::Freelance);

        return (new Vendor())
            ->setUser($user)
            ->addService($service);
    }
}

final class OverviewTestStepHandler implements StepHandlerInterface
{
    /** @param array<string, mixed> $stepData */
    public function __construct(
        private readonly OnboardingStep $step,
        private readonly bool $filled,
        private readonly array $stepData = [],
        private readonly ?VendorType $vendorType = null,
    ) {}

    public function supports(): OnboardingStep
    {
        return $this->step;
    }

    public function supportsVendorType(VendorType $type): bool
    {
        return $this->vendorType === null || $this->vendorType === $type;
    }

    public function handle(Vendor $vendor, array $data): void {}

    public function getStepData(Vendor $vendor): array
    {
        return $this->stepData;
    }

    public function isFilled(Vendor $vendor): bool
    {
        return $this->filled;
    }
}
