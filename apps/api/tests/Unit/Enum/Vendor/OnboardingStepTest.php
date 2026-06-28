<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum\Vendor;

use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use PHPUnit\Framework\TestCase;

final class OnboardingStepTest extends TestCase
{
    public function test_creator_universe_label_is_exposed(): void
    {
        $this->assertSame('Votre univers', OnboardingStep::CreatorUniverse->label(VendorType::Createurs));
    }
}
