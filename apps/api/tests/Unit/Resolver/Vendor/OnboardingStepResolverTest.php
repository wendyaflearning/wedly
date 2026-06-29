<?php

declare(strict_types=1);

namespace App\Tests\Unit\Resolver\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Resolver\Vendor\OnboardingStepResolver;
use PHPUnit\Framework\TestCase;

final class OnboardingStepResolverTest extends TestCase
{
    private OnboardingStepResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new OnboardingStepResolver();
    }

    // --- Freelance : parcours complet ---

    public function test_freelance_professions_returns_consent(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::Professions);
        $this->assertSame(OnboardingStep::Consent, $nextStep);
    }

    public function test_freelance_consent_returns_experiences(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::Consent);
        $this->assertSame(OnboardingStep::Experiences, $nextStep);
    }

    public function test_freelance_experiences_returns_zones_pricing(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::Experiences);
        $this->assertSame(OnboardingStep::ZonesPricing, $nextStep);
    }

    public function test_freelance_zones_pricing_returns_portfolio(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::ZonesPricing);
        $this->assertSame(OnboardingStep::Portfolio, $nextStep);
    }

    public function test_freelance_portfolio_returns_legal_info(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::Portfolio);
        $this->assertSame(OnboardingStep::LegalInfo, $nextStep);
    }

    public function test_freelance_legal_info_returns_credentials(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::LegalInfo);
        $this->assertSame(OnboardingStep::Credentials, $nextStep);
    }

    public function test_freelance_credentials_returns_null(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Freelance, OnboardingStep::Credentials);
        $this->assertNull($nextStep);
    }

    // --- Traiteur : transitions spécifiques ---

    public function test_traiteur_professions_returns_consent(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Traiteur, OnboardingStep::Professions);
        $this->assertSame(OnboardingStep::Consent, $nextStep);
    }

    public function test_traiteur_consent_returns_experiences(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Traiteur, OnboardingStep::Consent);
        $this->assertSame(OnboardingStep::Experiences, $nextStep);
    }

    public function test_traiteur_experiences_returns_catering_characteristics(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Traiteur, OnboardingStep::Experiences);
        $this->assertSame(OnboardingStep::CateringCharacteristics, $nextStep);
    }

    public function test_traiteur_catering_characteristics_returns_zones_pricing(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Traiteur, OnboardingStep::CateringCharacteristics);
        $this->assertSame(OnboardingStep::ZonesPricing, $nextStep);
    }

    public function test_traiteur_credentials_returns_null(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Traiteur, OnboardingStep::Credentials);
        $this->assertNull($nextStep);
    }

    // --- Lieu : transitions spécifiques ---

    public function test_lieu_professions_returns_venue_characteristics(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Lieu, OnboardingStep::Professions);
        $this->assertSame(OnboardingStep::VenueCharacteristics, $nextStep);
    }

    public function test_lieu_venue_characteristics_returns_zones_pricing(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Lieu, OnboardingStep::VenueCharacteristics);
        $this->assertSame(OnboardingStep::ZonesPricing, $nextStep);
    }

    public function test_lieu_credentials_returns_null(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Lieu, OnboardingStep::Credentials);
        $this->assertNull($nextStep);
    }

    // --- Nombre d'étapes par catégorie ---

    public function test_freelance_has_7_steps(): void
    {
        $steps = $this->resolver->getOnboardingSteps(VendorType::Freelance);
        $this->assertCount(7, $steps);
    }

    public function test_traiteur_has_8_steps(): void
    {
        $steps = $this->resolver->getOnboardingSteps(VendorType::Traiteur);
        $this->assertCount(8, $steps);
    }

    public function test_createurs_has_7_steps(): void
    {
        $steps = $this->resolver->getOnboardingSteps(VendorType::Createurs);
        $this->assertCount(7, $steps);
    }

    public function test_createurs_consent_returns_experiences(): void
    {
        $nextStep = $this->resolver->resolveNextStep(VendorType::Createurs, OnboardingStep::Consent);
        $this->assertSame(OnboardingStep::Experiences, $nextStep);
    }

    public function test_lieu_has_6_steps(): void
    {
        $steps = $this->resolver->getOnboardingSteps(VendorType::Lieu);
        $this->assertCount(6, $steps);
    }

    // --- Guard : CateringCharacteristics absent du parcours Freelance ---

    public function test_freelance_steps_do_not_include_catering_characteristics(): void
    {
        $steps = $this->resolver->getOnboardingSteps(VendorType::Freelance);
        $this->assertNotContains(OnboardingStep::CateringCharacteristics, $steps);
    }
}
